package repository

import (
	"time"

	"github.com/industrial-attachment/office-management-backend/internal/model"
	"gorm.io/gorm"
)

// SessionRepository defines the data-access contract for sessions.
type SessionRepository interface {
	Create(session *model.Session) error
	GetByToken(token string) (*model.Session, error)
	GetActiveByUserID(userID uint) ([]model.Session, error)
	DeleteByToken(token string) error
	DeleteAllByUserID(userID uint) error
	DeleteExpired() error
}

type sessionRepository struct {
	db *gorm.DB
}

// NewSessionRepository returns a concrete SessionRepository backed by GORM.
func NewSessionRepository(db *gorm.DB) SessionRepository {
	return &sessionRepository{db: db}
}

func (r *sessionRepository) Create(session *model.Session) error {
	return r.db.Create(session).Error
}

func (r *sessionRepository) GetByToken(token string) (*model.Session, error) {
	var session model.Session
	if err := r.db.Where("token = ? AND expires_at > ?", token, time.Now()).
		Preload("User").
		First(&session).Error; err != nil {
		return nil, err
	}
	return &session, nil
}

func (r *sessionRepository) GetActiveByUserID(userID uint) ([]model.Session, error) {
	var sessions []model.Session
	if err := r.db.Where("user_id = ? AND expires_at > ?", userID, time.Now()).
		Find(&sessions).Error; err != nil {
		return nil, err
	}
	return sessions, nil
}

func (r *sessionRepository) DeleteByToken(token string) error {
	return r.db.Where("token = ?", token).Delete(&model.Session{}).Error
}

func (r *sessionRepository) DeleteAllByUserID(userID uint) error {
	return r.db.Where("user_id = ?", userID).Delete(&model.Session{}).Error
}

func (r *sessionRepository) DeleteExpired() error {
	return r.db.Where("expires_at <= ?", time.Now()).Delete(&model.Session{}).Error
}


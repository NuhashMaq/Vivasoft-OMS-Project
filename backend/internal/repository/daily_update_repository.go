package repository

import (
	"context"
	"time"

	"github.com/industrial-attachment/office-management-backend/internal/model"
	"gorm.io/gorm"
)

type DailyUpdateRepository struct {
	DB *gorm.DB
}

func NewDailyUpdateRepository(db *gorm.DB) *DailyUpdateRepository {
	return &DailyUpdateRepository{DB: db}
}

func (r *DailyUpdateRepository) GetByUserAndDate(ctx context.Context, userID uint, date time.Time) (*model.DailyUpdate, error) {
	var du model.DailyUpdate
	err := r.DB.WithContext(ctx).
		Preload("Items").
		Where("user_id = ? AND update_date = ?", userID, date.Format("2006-01-02")).
		First(&du).Error
	if err != nil {
		return nil, err
	}
	return &du, nil
}

func (r *DailyUpdateRepository) Create(ctx context.Context, du *model.DailyUpdate) error {
	return r.DB.WithContext(ctx).Create(du).Error
}

func (r *DailyUpdateRepository) ReplaceItems(ctx context.Context, dailyUpdateID uint, items []model.DailyUpdateItem) error {
	tx := r.DB.WithContext(ctx)
	if err := tx.Where("daily_update_id = ?", dailyUpdateID).Delete(&model.DailyUpdateItem{}).Error; err != nil {
		return err
	}
	if len(items) == 0 {
		return nil
	}
	return tx.Create(&items).Error
}

func (r *DailyUpdateRepository) Update(ctx context.Context, du *model.DailyUpdate) error {
	return r.DB.WithContext(ctx).Save(du).Error
}

func (r *DailyUpdateRepository) CreateHistory(ctx context.Context, history *model.DailyUpdateHistory) error {
	return r.DB.WithContext(ctx).Create(history).Error
}

func (r *DailyUpdateRepository) ListByUserBetween(ctx context.Context, userID uint, from, to time.Time) ([]model.DailyUpdate, error) {
	var updates []model.DailyUpdate
	err := r.DB.WithContext(ctx).
		Preload("Items").
		Where("user_id = ? AND update_date BETWEEN ? AND ?", userID, from.Format("2006-01-02"), to.Format("2006-01-02")).
		Order("update_date DESC").
		Find(&updates).Error
	return updates, err
}

func (r *DailyUpdateRepository) CountUserSubmissionsByDates(ctx context.Context, userID uint, dates []time.Time) (int64, error) {
	if len(dates) == 0 {
		return 0, nil
	}
	values := make([]string, 0, len(dates))
	for _, d := range dates {
		values = append(values, d.Format("2006-01-02"))
	}
	var count int64
	err := r.DB.WithContext(ctx).
		Model(&model.DailyUpdate{}).
		Where("user_id = ? AND update_date IN ?", userID, values).
		Count(&count).Error
	return count, err
}

package service

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/industrial-attachment/office-management-backend/internal/config"
	"github.com/industrial-attachment/office-management-backend/internal/model"
	"github.com/industrial-attachment/office-management-backend/internal/repository"
)

// AuthService handles authentication: login, logout, session validation.
type AuthService interface {
	Login(email, password, ipAddress, userAgent string) (*model.Session, string, error)
	Logout(token string) error
	LogoutAll(userID uint) error
	ValidateSession(token string) (*model.Session, error)
	CleanExpiredSessions() error
}

type authService struct {
	userService UserService
	sessionRepo repository.SessionRepository
	cfg         *config.Config
}

// NewAuthService creates a new AuthService.
func NewAuthService(
	userService UserService,
	sessionRepo repository.SessionRepository,
	cfg *config.Config,
) AuthService {
	return &authService{
		userService: userService,
		sessionRepo: sessionRepo,
		cfg:         cfg,
	}
}

// Login authenticates a user and creates a new session with a JWT token.
func (s *authService) Login(email, password, ipAddress, userAgent string) (*model.Session, string, error) {
	// Authenticate credentials (bcrypt comparison lives in UserService)
	user, err := s.userService.AuthenticateUser(email, password)
	if err != nil {
		return nil, "", err
	}

	// Generate JWT
	expiresAt := time.Now().Add(time.Duration(s.cfg.JWT.ExpiryHours) * time.Hour)
	token, err := s.generateJWT(user, expiresAt)
	if err != nil {
		return nil, "", errors.New("failed to generate token")
	}

	// Persist session
	session := &model.Session{
		UserID:    user.ID,
		Token:     token,
		IPAddress: ipAddress,
		UserAgent: userAgent,
		ExpiresAt: expiresAt,
	}

	if err := s.sessionRepo.Create(session); err != nil {
		return nil, "", errors.New("failed to create session")
	}

	return session, token, nil
}

// Logout invalidates a single session by its token.
func (s *authService) Logout(token string) error {
	return s.sessionRepo.DeleteByToken(token)
}

// LogoutAll invalidates every session for a given user.
func (s *authService) LogoutAll(userID uint) error {
	return s.sessionRepo.DeleteAllByUserID(userID)
}

// ValidateSession checks if a token maps to a valid, non-expired session.
func (s *authService) ValidateSession(token string) (*model.Session, error) {
	session, err := s.sessionRepo.GetByToken(token)
	if err != nil {
		return nil, errors.New("invalid or expired session")
	}

	if time.Now().After(session.ExpiresAt) {
		// Clean it up
		_ = s.sessionRepo.DeleteByToken(token)
		return nil, errors.New("session expired")
	}

	return session, nil
}

// CleanExpiredSessions removes all expired sessions from the database.
func (s *authService) CleanExpiredSessions() error {
	return s.sessionRepo.DeleteExpired()
}

// generateJWT creates a signed JWT token for the given user.
func (s *authService) generateJWT(user *model.User, expiresAt time.Time) (string, error) {
	claims := jwt.MapClaims{
		"sub":   user.ID,
		"email": user.Email,
		"role":  user.Role,
		"iat":   time.Now().Unix(),
		"exp":   expiresAt.Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.cfg.JWT.SecretKey))
}


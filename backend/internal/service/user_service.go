package service

import (
	"errors"

	"github.com/industrial-attachment/office-management-backend/internal/model"
	"github.com/industrial-attachment/office-management-backend/internal/repository"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type UserService interface {
	CreateUser(req *model.CreateUserRequest) (*model.UserResponse, error)
	GetUserByID(id uint) (*model.UserResponse, error)
	GetUserByEmail(email string) (*model.User, error)
	UpdateUser(id uint, req *model.UpdateUserRequest) (*model.UserResponse, error)
	DeleteUser(id uint) error
	ListUsers(page, pageSize int) ([]model.UserResponse, int64, error)
	AuthenticateUser(email, password string) (*model.User, error)
}

type userService struct {
	repo repository.UserRepository
}

func NewUserService(repo repository.UserRepository) UserService {
	return &userService{repo: repo}
}

func (s *userService) CreateUser(req *model.CreateUserRequest) (*model.UserResponse, error) {
	// Check if user already exists
	if _, err := s.repo.GetByEmail(req.Email); err == nil {
		return nil, errors.New("user with this email already exists")
	}

	// Hash password
	hashedPassword, err := hashPassword(req.Password)
	if err != nil {
		return nil, err
	}

	user := &model.User{
		FirstName: req.FirstName,
		LastName:  req.LastName,
		Email:     req.Email,
		Password:  hashedPassword,
		Role:      "user",
		IsActive:  true,
	}

	if err := s.repo.Create(user); err != nil {
		return nil, err
	}

	return toUserResponse(user), nil
}

func (s *userService) GetUserByID(id uint) (*model.UserResponse, error) {
	user, err := s.repo.GetByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}
	return toUserResponse(user), nil
}

func (s *userService) GetUserByEmail(email string) (*model.User, error) {
	return s.repo.GetByEmail(email)
}

func (s *userService) UpdateUser(id uint, req *model.UpdateUserRequest) (*model.UserResponse, error) {
	user, err := s.repo.GetByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}

	if req.FirstName != "" {
		user.FirstName = req.FirstName
	}
	if req.LastName != "" {
		user.LastName = req.LastName
	}
	if req.Email != "" {
		user.Email = req.Email
	}

	if err := s.repo.Update(user); err != nil {
		return nil, err
	}

	return toUserResponse(user), nil
}

func (s *userService) DeleteUser(id uint) error {
	_, err := s.repo.GetByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("user not found")
		}
		return err
	}
	return s.repo.Delete(id)
}

func (s *userService) ListUsers(page, pageSize int) ([]model.UserResponse, int64, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 10
	}

	users, total, err := s.repo.GetAll(page, pageSize)
	if err != nil {
		return nil, 0, err
	}

	responses := make([]model.UserResponse, len(users))
	for i, user := range users {
		responses[i] = *toUserResponse(&user)
	}

	return responses, total, nil
}

func (s *userService) AuthenticateUser(email, password string) (*model.User, error) {
	user, err := s.repo.GetByEmail(email)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("invalid credentials")
		}
		return nil, err
	}

	if !user.IsActive {
		return nil, errors.New("user is not active")
	}

	if err := verifyPassword(user.Password, password); err != nil {
		return nil, errors.New("invalid credentials")
	}

	return user, nil
}

func hashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

func verifyPassword(hashedPassword, password string) error {
	return bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
}

func toUserResponse(user *model.User) *model.UserResponse {
	return &model.UserResponse{
		ID:        user.ID,
		FirstName: user.FirstName,
		LastName:  user.LastName,
		Email:     user.Email,
		Role:      user.Role,
		IsActive:  user.IsActive,
		CreatedAt: user.CreatedAt,
		UpdatedAt: user.UpdatedAt,
	}
}


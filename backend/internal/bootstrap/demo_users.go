package bootstrap

import (
	"errors"
	"fmt"

	"github.com/industrial-attachment/office-management-backend/internal/model"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type demoUser struct {
	FirstName string
	LastName  string
	Email     string
	Role      string
}

// EnsureDemoUsers creates or refreshes demo users for login.
func EnsureDemoUsers(db *gorm.DB) error {
	users := []demoUser{
		{FirstName: "Super", LastName: "Admin", Email: "superadmin@oms2.local", Role: model.RoleSuperAdmin},
		{FirstName: "System", LastName: "Admin", Email: "admin@oms2.local", Role: model.RoleAdmin},
		{FirstName: "Project", LastName: "Manager", Email: "manager@oms2.local", Role: model.RoleManager},
		{FirstName: "Demo", LastName: "Employee", Email: "demo.employee.01@oms2.local", Role: model.RoleUser},
	}

	for _, u := range users {
		hashed, err := bcrypt.GenerateFromPassword([]byte("password"), bcrypt.DefaultCost)
		if err != nil {
			return fmt.Errorf("hash password: %w", err)
		}

		var existing model.User
		err = db.Unscoped().Where("email = ?", u.Email).First(&existing).Error
		switch {
		case err == nil:
			if err := db.Unscoped().Model(&existing).Updates(map[string]any{
				"first_name": u.FirstName,
				"last_name":  u.LastName,
				"role":       u.Role,
				"password":   string(hashed),
				"is_active":  true,
				"deleted_at": nil,
			}).Error; err != nil {
				return fmt.Errorf("update demo user %s: %w", u.Email, err)
			}
		case errors.Is(err, gorm.ErrRecordNotFound):
			user := model.User{
				FirstName: u.FirstName,
				LastName:  u.LastName,
				Email:     u.Email,
				Password:  string(hashed),
				Role:      u.Role,
				IsActive:  true,
			}
			if err := db.Create(&user).Error; err != nil {
				return fmt.Errorf("create demo user %s: %w", u.Email, err)
			}
		default:
			return fmt.Errorf("find demo user %s: %w", u.Email, err)
		}
	}

	return nil
}

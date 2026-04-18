package model

import (
	"time"

	"gorm.io/gorm"
)

// Session represents an active user session backed by a JWT token.
type Session struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	UserID    uint           `gorm:"index;not null" json:"user_id"`
	Token     string         `gorm:"uniqueIndex;size:512;not null" json:"-"`
	IPAddress string         `gorm:"size:45" json:"ip_address"`
	UserAgent string         `gorm:"size:512" json:"user_agent"`
	ExpiresAt time.Time      `gorm:"not null" json:"expires_at"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	// Belongs-to relationship
	User User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}


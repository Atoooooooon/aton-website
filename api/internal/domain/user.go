package domain

import (
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type User struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Username  string    `json:"username" gorm:"uniqueIndex;not null"`
	Password  string    `json:"-" gorm:"not null"` // "-" prevents password from being exposed in JSON
	Email     string    `json:"email" gorm:"uniqueIndex"`
	Role      string    `json:"role" gorm:"default:'admin'"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// HashPassword hashes the user's password before saving
func (u *User) HashPassword(password string) error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u.Password = string(hashedPassword)
	return nil
}

// CheckPassword verifies the password
func (u *User) CheckPassword(password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password))
	return err == nil
}

// BeforeCreate hook to hash password before saving
func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.Password != "" && len(u.Password) < 60 {
		return u.HashPassword(u.Password)
	}
	return nil
}
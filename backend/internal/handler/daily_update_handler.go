package handler

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/industrial-attachment/office-management-backend/internal/model"
	"github.com/industrial-attachment/office-management-backend/internal/service"
)

type DailyUpdateHandler struct {
	Service *service.DailyUpdateService
}

func NewDailyUpdateHandler(svc *service.DailyUpdateService) *DailyUpdateHandler {
	return &DailyUpdateHandler{Service: svc}
}

func (h *DailyUpdateHandler) Upsert(c *gin.Context) {
	userIDRaw, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := toUint(userIDRaw)

	var req model.UpsertDailyUpdateReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}

	du, err := h.Service.Upsert(c.Request.Context(), userID, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, du)
}

func (h *DailyUpdateHandler) ListMine(c *gin.Context) {
	userIDRaw, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := toUint(userIDRaw)

	from, to, err := readDateRange(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updates, err := h.Service.ListByUser(c.Request.Context(), userID, from, to)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": updates})
}

func (h *DailyUpdateHandler) MyCompliance(c *gin.Context) {
	userIDRaw, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := toUint(userIDRaw)

	from, to, err := readDateRange(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	missing, err := h.Service.MissingWeekdayCount(c.Request.Context(), userID, from, to)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"from":             from.Format("2006-01-02"),
		"to":               to.Format("2006-01-02"),
		"missing_weekdays": missing,
	})
}

func readDateRange(c *gin.Context) (time.Time, time.Time, error) {
	now := time.Now().UTC()
	defaultTo := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
	defaultFrom := defaultTo.AddDate(0, 0, -30)

	from := c.DefaultQuery("from", defaultFrom.Format("2006-01-02"))
	to := c.DefaultQuery("to", defaultTo.Format("2006-01-02"))

	fromDate, err := time.Parse("2006-01-02", from)
	if err != nil {
		return time.Time{}, time.Time{}, err
	}
	toDate, err := time.Parse("2006-01-02", to)
	if err != nil {
		return time.Time{}, time.Time{}, err
	}

	fromDate = time.Date(fromDate.Year(), fromDate.Month(), fromDate.Day(), 0, 0, 0, 0, time.UTC)
	toDate = time.Date(toDate.Year(), toDate.Month(), toDate.Day(), 0, 0, 0, 0, time.UTC)
	return fromDate, toDate, nil
}

func toUint(v interface{}) uint {
	switch val := v.(type) {
	case uint:
		return val
	case float64:
		return uint(val)
	case int:
		return uint(val)
	case int64:
		return uint(val)
	default:
		return 0
	}
}

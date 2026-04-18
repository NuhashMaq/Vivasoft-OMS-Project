package app

import "errors"

var (
	// ErrUnauthorized indicates caller has no access to requested project data.
	ErrUnauthorized = errors.New("unauthorized project access")
	// ErrKPIForbidden indicates KPI data is restricted to Super Admin.
	ErrKPIForbidden = errors.New("kpi visibility is restricted to super_admin")
)

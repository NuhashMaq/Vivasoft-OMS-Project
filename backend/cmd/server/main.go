package main

import (
	"log"

	"github.com/gin-gonic/gin"
	"github.com/industrial-attachment/office-management-backend/internal/bootstrap"
	"github.com/industrial-attachment/office-management-backend/internal/config"
	"github.com/industrial-attachment/office-management-backend/internal/handler"
	"github.com/industrial-attachment/office-management-backend/internal/middleware"
	"github.com/industrial-attachment/office-management-backend/internal/model"
	"github.com/industrial-attachment/office-management-backend/internal/repository"
	"github.com/industrial-attachment/office-management-backend/internal/service"
)

func main() {
	// Load configuration
	cfg := config.NewConfig()

	// Initialize database
	db := config.InitDatabase(cfg)
	defer config.CloseDatabase(db)

	// Auto migrate models
	if err := db.AutoMigrate(
		&model.User{},
		&model.Session{},
		&model.Permission{},
		&model.RolePermission{},
		&model.ProjectRole{},
		&model.Task{},
		&model.TaskStatusLog{},
		&model.Employee{},
		&model.Project{},
		&model.DailyUpdate{},
		&model.DailyUpdateItem{},
		&model.DailyUpdateHistory{},
	); err != nil {
		log.Fatalf("Failed to auto migrate models: %v", err)
	}

	// Initialize repositories
	userRepo := repository.NewUserRepository(db)
	sessionRepo := repository.NewSessionRepository(db)
	permRepo := repository.NewPermissionRepository(db)
	rpRepo := repository.NewRolePermissionRepository(db)
	projRoleRepo := repository.NewProjectRoleRepository(db)
	taskRepo := repository.NewTaskRepository(db)
	taskStatusLogRepo := repository.NewTaskStatusLogRepository(db)
	employeeRepo := repository.NewEmployeeRepository(db)
	projectRepo := repository.NewProjectRepository(db)
	dailyUpdateRepo := repository.NewDailyUpdateRepository(db)

	// Initialize services
	userService := service.NewUserService(userRepo)
	authService := service.NewAuthService(userService, sessionRepo, cfg)
	rbacService := service.NewRBACService(userRepo, permRepo, rpRepo, projRoleRepo)
	taskService := service.NewTaskService(taskRepo, employeeRepo, taskStatusLogRepo)
	employeeService := service.NewEmployeeService(employeeRepo)
	projectService := service.NewProjectService(projectRepo)
	dailyUpdateService := service.NewDailyUpdateService(dailyUpdateRepo, taskRepo)

	// Seed default permissions & role mappings
	if err := rbacService.SeedDefaultPermissions(); err != nil {
		log.Printf("⚠ Warning: failed to seed default permissions: %v", err)
	} else {
		log.Println("✓ Default permissions seeded successfully")
	}

	if err := bootstrap.EnsureDemoUsers(db); err != nil {
		log.Printf("⚠ Warning: failed to bootstrap demo users: %v", err)
	} else {
		log.Println("✓ Demo users ready")
	}

	// Initialize handlers
	userHandler := handler.NewUserHandler(userService)
	authHandler := handler.NewAuthHandler(authService)
	rbacHandler := handler.NewRBACHandler(rbacService)
	taskHandler := handler.NewTaskHandler(taskService, cfg.RAG.EngineURL)
	employeeHandler := handler.NewEmployeeHandler(employeeService)
	projectHandler := handler.NewProjectHandler(projectService)
	dailyUpdateHandler := handler.NewDailyUpdateHandler(dailyUpdateService)
	kpiHandler := handler.NewKpiHandler(db)

	// Initialize Gin router
	router := gin.Default()
	_ = router.SetTrustedProxies([]string{"127.0.0.1"})

	// Routes
	api := router.Group("/api")
	{
		v1 := api.Group("/v1")
		{
			// ── Public auth routes ──────────────────────────────
			auth := v1.Group("/auth")
			{
				auth.POST("/login", authHandler.Login)
			}

			// ── Public user routes ──────────────────────────────
			users := v1.Group("/users")
			{
				users.POST("", userHandler.CreateUser)
				users.GET("", userHandler.ListUsers)
				users.GET("/:id", userHandler.GetUser)
			}
		}

		// ── Protected routes (require valid session) ────────
		v1Protected := api.Group("/v1")
		v1Protected.Use(middleware.AuthMiddleware(cfg, authService))
		{
			// Protected auth routes
			protectedAuth := v1Protected.Group("/auth")
			{
				protectedAuth.POST("/logout", authHandler.Logout)
				protectedAuth.POST("/logout-all", authHandler.LogoutAll)
				protectedAuth.GET("/me", authHandler.Me)
			}

			// Protected user routes
			users := v1Protected.Group("/users")
			{
				users.PUT("/:id",
					middleware.RequirePermission(rbacService, "users:update"),
					userHandler.UpdateUser,
				)
				users.DELETE("/:id",
					middleware.RequirePermission(rbacService, "users:delete"),
					userHandler.DeleteUser,
				)
			}

			// ── System role management (super_admin only) ───
			roles := v1Protected.Group("/roles")
			{
				roles.PUT("/system",
					middleware.RequireRole(model.RoleSuperAdmin),
					rbacHandler.AssignSystemRole,
				)
				roles.GET("/permissions", rbacHandler.GetPermissions)
			}

			// ── Project CRUD ───────────────────────────────
			projects := v1Protected.Group("/projects")
			{
				projects.POST("/:project_id/tasks",
					middleware.RestrictSuperAdminTaskModification(),
					middleware.RequirePermission(rbacService, "tasks:create"),
					taskHandler.CreateTask,
				)

				projects.GET("/:project_id/tasks",
					middleware.RequirePermission(rbacService, "tasks:read"),
					taskHandler.ListTasksByProject,
				)
				projects.GET("", projectHandler.ListProjects)
				projects.GET("/:project_id", projectHandler.GetProject)
				projects.POST("",
					middleware.RequirePermission(rbacService, "projects:create"),
					projectHandler.CreateProject,
				)
				projects.PUT("/:project_id",
					middleware.RequirePermission(rbacService, "projects:update"),
					projectHandler.UpdateProject,
				)
				projects.DELETE("/:project_id",
					middleware.RequirePermission(rbacService, "projects:delete"),
					projectHandler.DeleteProject,
				)

				// ── Project role management ─────────────────
				projects.POST("/:project_id/roles",
					middleware.RequirePermission(rbacService, "projects:assign_role"),
					rbacHandler.AssignProjectRole,
				)
				projects.GET("/:project_id/roles",
					rbacHandler.GetProjectMembers,
				)
				projects.PUT("/:project_id/roles/:user_id",
					middleware.RequirePermission(rbacService, "projects:assign_role"),
					rbacHandler.UpdateProjectRole,
				)
				projects.DELETE("/:project_id/roles/:user_id",
					middleware.RequirePermission(rbacService, "projects:assign_role"),
					rbacHandler.RevokeProjectRole,
				)
			}

			tasks := v1Protected.Group("/tasks")
			{
				tasks.GET("/:id",
					middleware.RequirePermission(rbacService, "tasks:read"),
					taskHandler.GetTask,
				)
				tasks.GET("/:id/history",
					middleware.RequirePermission(rbacService, "tasks:read"),
					taskHandler.GetTaskHistory,
				)
				tasks.PUT("/:id",
					middleware.RestrictSuperAdminTaskModification(),
					middleware.RequirePermission(rbacService, "tasks:update"),
					taskHandler.UpdateTask,
				)
				tasks.PATCH("/:id/status",
					middleware.RestrictSuperAdminTaskModification(),
					middleware.RequirePermission(rbacService, "tasks:update"),
					taskHandler.UpdateTaskStatus,
				)
				tasks.DELETE("/:id",
					middleware.RestrictSuperAdminTaskModification(),
					middleware.RequirePermission(rbacService, "tasks:delete"),
					taskHandler.DeleteTask,
				)
			}

			// v1Protected.PATCH("/tasks/:id/status",
			// 	middleware.RequirePermission(rbacService, "tasks:update"),
			// 	taskHandler.UpdateTaskStatus,
			// )

			// ── Task routes (super_admin restricted) ────────
			// When task endpoints are added, apply the restriction:
			// tasks := v1Protected.Group("/tasks")
			// tasks.POST("", middleware.RestrictSuperAdminTaskModification(), taskHandler.Create)
			// tasks.PUT("/:id", middleware.RestrictSuperAdminTaskModification(), taskHandler.Update)
			// tasks.DELETE("/:id", middleware.RestrictSuperAdminTaskModification(), taskHandler.Delete)

			// ── Employee routes ─────────────────────────────
			employees := v1Protected.Group("/employees")
			{
				employees.GET("", employeeHandler.ListEmployees)
				employees.GET("/:id", employeeHandler.GetEmployee)
				employees.POST("",
					middleware.RequirePermission(rbacService, "employees:create"),
					employeeHandler.CreateEmployee,
				)
				employees.PUT("/:id",
					middleware.RequirePermission(rbacService, "employees:update"),
					employeeHandler.UpdateEmployee,
				)
				employees.DELETE("/:id",
					middleware.RequirePermission(rbacService, "employees:delete"),
					employeeHandler.DeleteEmployee,
				)
			}

			dailyUpdates := v1Protected.Group("/daily-updates")
			{
				dailyUpdates.POST("", dailyUpdateHandler.Upsert)
				dailyUpdates.GET("", dailyUpdateHandler.ListMine)
				dailyUpdates.GET("/compliance", dailyUpdateHandler.MyCompliance)
			}

			kpi := v1Protected.Group("/kpi")
			{
				kpi.GET("/report", kpiHandler.GetReport)
			}
		}
	}

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "healthy",
		})
	})

	log.Printf("✓ Server starting on %s", cfg.GetServerAddress())
	if err := router.Run(cfg.GetServerAddress()); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}


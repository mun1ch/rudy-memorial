# Rudy Memorial Site - Development Makefile
# Usage: make dev, make stop, make restart, make logs

# Configuration
PORT := 6464
PID_FILE := .dev-server.pid
LOG_FILE := .dev-server.log
NODE_ENV := development

# Colors for output
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[1;33m
BLUE := \033[0;34m
NC := \033[0m # No Color

.PHONY: help dev stop restart logs status clean install build test

# Default target
help:
	@echo "$(BLUE)Rudy Memorial Site - Development Commands$(NC)"
	@echo ""
	@echo "$(GREEN)Available commands:$(NC)"
	@echo "  $(YELLOW)make dev$(NC)      - Start development server in background"
	@echo "  $(YELLOW)make stop$(NC)     - Stop development server"
	@echo "  $(YELLOW)make restart$(NC)  - Restart development server"
	@echo "  $(YELLOW)make logs$(NC)     - Show server logs (follow mode)"
	@echo "  $(YELLOW)make status$(NC)   - Check server status"
	@echo "  $(YELLOW)make clean$(NC)    - Clean up PID and log files"
	@echo "  $(YELLOW)make install$(NC)  - Install dependencies"
	@echo "  $(YELLOW)make build$(NC)    - Build for production"
	@echo "  $(YELLOW)make test$(NC)     - Run tests"
	@echo ""

# Start development server in background
dev:
	@echo "$(BLUE)Starting Rudy Memorial development server...$(NC)"
	@if [ -f $(PID_FILE) ]; then \
		echo "$(YELLOW)Server already running (PID: $$(cat $(PID_FILE)))$(NC)"; \
		echo "$(YELLOW)Use 'make stop' to stop it first, or 'make restart' to restart$(NC)"; \
		exit 1; \
	fi
	@echo "$(GREEN)Starting server on port $(PORT)...$(NC)"
	@nohup npm run dev > $(LOG_FILE) 2>&1 & echo $$! > $(PID_FILE)
	@sleep 3
	@if [ -f $(PID_FILE) ] && kill -0 $$(cat $(PID_FILE)) 2>/dev/null; then \
		echo "$(GREEN)✅ Server started successfully!$(NC)"; \
		echo "$(BLUE)📱 URL: http://localhost:$(PORT)$(NC)"; \
		echo "$(BLUE)📋 PID: $$(cat $(PID_FILE))$(NC)"; \
		echo "$(BLUE)📄 Logs: $(LOG_FILE)$(NC)"; \
		echo "$(YELLOW)Use 'make logs' to view logs, 'make stop' to stop server$(NC)"; \
	else \
		echo "$(RED)❌ Failed to start server$(NC)"; \
		rm -f $(PID_FILE); \
		exit 1; \
	fi

# Stop development server
stop:
	@echo "$(BLUE)Stopping Rudy Memorial development server...$(NC)"
	@if [ ! -f $(PID_FILE) ]; then \
		echo "$(YELLOW)No PID file found. Server may not be running.$(NC)"; \
		exit 0; \
	fi
	@PID=$$(cat $(PID_FILE)); \
	if kill -0 $$PID 2>/dev/null; then \
		echo "$(GREEN)Stopping server (PID: $$PID)...$(NC)"; \
		kill $$PID; \
		sleep 2; \
		if kill -0 $$PID 2>/dev/null; then \
			echo "$(YELLOW)Server didn't stop gracefully, forcing...$(NC)"; \
			kill -9 $$PID; \
		fi; \
		echo "$(GREEN)✅ Server stopped$(NC)"; \
	else \
		echo "$(YELLOW)Server (PID: $$PID) was not running$(NC)"; \
	fi
	@rm -f $(PID_FILE)
	@echo "$(BLUE)Cleaned up PID file$(NC)"

# Restart development server
restart: stop dev

# Show server logs (follow mode)
logs:
	@echo "$(BLUE)Showing Rudy Memorial server logs...$(NC)"
	@echo "$(YELLOW)Press Ctrl+C to exit log viewing$(NC)"
	@echo ""
	@if [ -f $(LOG_FILE) ]; then \
		tail -f $(LOG_FILE); \
	else \
		echo "$(RED)No log file found. Server may not be running.$(NC)"; \
		echo "$(YELLOW)Use 'make dev' to start the server$(NC)"; \
	fi

# Check server status
status:
	@echo "$(BLUE)Rudy Memorial Server Status$(NC)"
	@echo "================================"
	@if [ -f $(PID_FILE) ]; then \
		PID=$$(cat $(PID_FILE)); \
		if kill -0 $$PID 2>/dev/null; then \
			echo "$(GREEN)✅ Server is running$(NC)"; \
			echo "$(BLUE)📋 PID: $$PID$(NC)"; \
			echo "$(BLUE)📱 URL: http://localhost:$(PORT)$(NC)"; \
			echo "$(BLUE)📄 Log file: $(LOG_FILE)$(NC)"; \
			echo "$(BLUE)📊 Memory usage:$$(ps -o pid,rss,pcpu,comm -p $$PID | tail -1)$(NC)"; \
		else \
			echo "$(RED)❌ Server is not running (stale PID file)$(NC)"; \
			echo "$(YELLOW)Cleaning up stale PID file...$(NC)"; \
			rm -f $(PID_FILE); \
		fi; \
	else \
		echo "$(RED)❌ Server is not running$(NC)"; \
		echo "$(YELLOW)Use 'make dev' to start the server$(NC)"; \
	fi

# Clean up PID and log files
clean:
	@echo "$(BLUE)Cleaning up development files...$(NC)"
	@rm -f $(PID_FILE) $(LOG_FILE)
	@echo "$(GREEN)✅ Cleaned up PID and log files$(NC)"

# Install dependencies
install:
	@echo "$(BLUE)Installing dependencies...$(NC)"
	@npm install
	@echo "$(GREEN)✅ Dependencies installed$(NC)"

# Build for production
build:
	@echo "$(BLUE)Building for production...$(NC)"
	@npm run build
	@echo "$(GREEN)✅ Production build complete$(NC)"

# Run tests
test:
	@echo "$(BLUE)Running tests...$(NC)"
	@npm test
	@echo "$(GREEN)✅ Tests completed$(NC)"

# Development workflow
dev-setup: install dev
	@echo "$(GREEN)🎉 Development environment ready!$(NC)"
	@echo "$(BLUE)📱 Open http://localhost:$(PORT) in your browser$(NC)"

# Quick restart (useful during development)
quick-restart: stop
	@sleep 1
	@make dev

# Show help by default
.DEFAULT_GOAL := help

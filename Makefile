.PHONY: start stop restart

# PID file location
PID_FILE := .dev-server.pid

# Start the development server (includes build)
start:
	@echo "Building and starting development server..."
	@npm run build
	@echo "Checking for existing server from PID file..."
	@if [ -f $(PID_FILE) ]; then \
		PID=$$(cat $(PID_FILE)); \
		if ps -p $$PID > /dev/null 2>&1; then \
			echo "Found existing server process $$PID, stopping it..."; \
			kill $$PID 2>/dev/null || true; \
			sleep 2; \
			if ps -p $$PID > /dev/null 2>&1; then \
				echo "Force killing process $$PID..."; \
				kill -9 $$PID 2>/dev/null || true; \
			fi; \
		fi; \
		rm -f $(PID_FILE); \
	fi
	@echo "Starting development server in background..."
	@nohup npm run dev > .dev-server.log 2>&1 & echo $$! > $(PID_FILE)
	@echo "Development server started with PID $$(cat $(PID_FILE))"
	@echo "Waiting for server to start..."
	@sleep 5
	@echo "Checking if server is responding..."
	@for i in 1 2 3 4 5; do \
		if curl -s http://localhost:6464 > /dev/null 2>&1; then \
			echo "✅ Server is responding at http://localhost:6464"; \
			break; \
		else \
			echo "⏳ Waiting for server... (attempt $$i/5)"; \
			sleep 2; \
		fi; \
	done
	@echo "Logs available at .dev-server.log"

# Stop the development server
stop:
	@echo "Stopping development server..."
	@if [ -f $(PID_FILE) ]; then \
		PID=$$(cat $(PID_FILE)); \
		if ps -p $$PID > /dev/null 2>&1; then \
			echo "Killing process $$PID..."; \
			kill $$PID; \
			sleep 2; \
			if ps -p $$PID > /dev/null 2>&1; then \
				echo "Force killing process $$PID..."; \
				kill -9 $$PID; \
			fi; \
		else \
			echo "Process $$PID not found"; \
		fi; \
		rm -f $(PID_FILE); \
	fi
	@echo "Development server stopped"

# Restart the development server
restart: stop start
	@echo "Development server restarted"
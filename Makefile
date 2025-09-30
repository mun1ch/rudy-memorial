.PHONY: start stop restart

# PID file location
PID_FILE := .dev-server.pid

# Start the development server (includes build)
start:
	@echo "Building and starting development server..."
	npm run build
	@echo "Checking for existing processes on port 6464..."
	@if lsof -ti:6464 > /dev/null 2>&1; then \
		echo "Port 6464 is in use, killing existing process..."; \
		PID=$$(lsof -ti:6464); \
		echo "Killing process $$PID using port 6464..."; \
		kill -9 $$PID 2>/dev/null || true; \
		sleep 2; \
	fi
	@echo "Starting development server in background..."
	@nohup npm run dev > .dev-server.log 2>&1 & echo $$! > $(PID_FILE)
	@echo "Development server started with PID $$(cat $(PID_FILE))"
	@echo "Waiting for server to start..."
	@sleep 3
	@echo "Server running at http://localhost:6464"
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
	@echo "Checking for any remaining processes on port 6464..."
	@if lsof -ti:6464 > /dev/null 2>&1; then \
		echo "Found process using port 6464, killing it..."; \
		PID=$$(lsof -ti:6464); \
		echo "Killing process $$PID using port 6464..."; \
		kill -9 $$PID 2>/dev/null || true; \
		sleep 1; \
	fi
	@echo "Killing any remaining 'next dev' processes..."
	@pkill -f "next dev" || true
	@echo "Development server stopped"

# Restart the development server
restart: stop start
	@echo "Development server restarted"
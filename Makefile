.PHONY: start stop restart

# Start the development server (includes build)
start:
	@echo "Building and starting development server..."
	npm run build
	npm run dev

# Stop the development server
stop:
	@echo "Stopping development server..."
	@pkill -f "next dev" || true

# Restart the development server
restart: stop start
	@echo "Development server restarted"
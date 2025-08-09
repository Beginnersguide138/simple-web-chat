# Use an official Node runtime as a parent image
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock, etc.)
COPY package*.json ./

# Install dependencies
# Using --frozen-lockfile is a good practice for CI/CD and production builds
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 5173

# The command to run the app
# Using --host is important to expose the server to the host machine
CMD ["npm", "run", "dev", "--", "--host"]

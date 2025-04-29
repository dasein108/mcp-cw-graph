# Use an official Node.js runtime as a base image
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package files separately to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Set the command to run the app
CMD ["npm", "run", "build"]

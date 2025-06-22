# Use Node.js v16
FROM node:16

# Set the working directory to the root of the project
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install production dependencies
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Expose the port GoatBot V2 listens on
EXPOSE 3000

# Start the application
CMD ["node", "index.js"]

# Step 1: Use official Node.js image
FROM node:18

# Step 2: Set working directory
WORKDIR /app

# Step 3: Copy package files
COPY package*.json ./

# Step 4: Install dependencies
RUN npm install

# Step 5: Copy all project files
COPY . .

# Step 6: Expose port (Fly.io uses PORT env)
EXPOSE 8080

# Step 7: Start command (adjust if needed)
CMD ["npm", "run", "start"]

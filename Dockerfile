# Use official Node.js image
FROM node:18

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install app dependencies
RUN npm install
RUN npm install typescript -g

# Bundle app source
COPY . .

# Expose port
EXPOSE 3000

# Command to run the app
CMD [ "npm", "run", "start" ]

FROM node:current-alpine3.20

# Create USER
RUN addgroup -S app && adduser -S -G app app
USER app

# Copy Files & Install Project Dependencies
WORKDIR /app
COPY --chown=app:app package*.json .
RUN npm install
COPY --chown=app:app . .

# Start the Server
CMD ["npm", "start"]
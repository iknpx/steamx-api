FROM node:carbon

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
ENV STEAM_KEY=$STEAM_KEY

EXPOSE 5000
CMD [ "npm", "start" ]

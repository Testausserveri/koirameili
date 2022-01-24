FROM node:16-alpine

WORKDIR /usr/src/app

COPY . .
RUN npm install

WORKDIR /usr/src/app/frontend/
RUN yarn install
RUN yarn build

WORKDIR /usr/src/app

EXPOSE 25

CMD ["npm", "start"]
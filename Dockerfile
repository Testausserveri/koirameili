FROM node:21-alpine

WORKDIR /usr/src/app

RUN apk update \
    && apk add fontconfig \
    && apk add chromium \
    && apk add chromium-chromedriver

RUN wget https://raw.githubusercontent.com/itfoundry/Poppins/master/products/Poppins-4.003-GoogleFonts-TTF.zip -O poppins.zip \
    && unzip poppins.zip -d poppins \
    && mkdir -p /usr/share/fonts/truetype/poppins \
    && find $PWD/poppins/ -name "*.ttf" -exec install -m644 {} /usr/share/fonts/truetype/poppins/ \; || return 1 \
    && rm -f poppins.zip \
    && fc-cache -f && rm -rf /var/cache/*

COPY . .
RUN npm install

WORKDIR /usr/src/app/frontend/
RUN yarn install
RUN yarn build

WORKDIR /usr/src/app

RUN addgroup -S koirameili && adduser -S koirameili -G koirameili && chown -R koirameili:koirameili /usr/src/app
USER koirameili
EXPOSE 25

CMD ["npm", "start"]
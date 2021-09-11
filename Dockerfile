FROM node

RUN npm i -g nodemon

RUN mkdir /app
WORKDIR /app

COPY . /app/

RUN npm install

CMD [ "npm", "start" ]
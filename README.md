# Diffie-Hellman Demonstration

The purpose of this application is to demonstrate the Diffie-Hellman
key exchange algorithm.

## 1. Installing the Demonstration Application

This application runs in Node.js. It uses Node.js and Bower dependencies.
The dependencies are not shipped with the source code.

### 1a. Installing Node.js

Check here: https://nodejs.org/en/

### 1b. Installing Bower

Check here: http://bower.io/#install-bower

### 1c. Obtain the source code

You are looking at it.

### 1d. Install Node dependencies

Within the project root, run the command: `npm install`

### 1e. Install Bower dependencies

Within the project root, run the command: `bower install`

### 2. Running the Demonstration Application

The demonstration application is a web-based application and ships with
the application server and the web application.

Run `node demo` from the project root. It will start a web server listening on
port 3000. Navigate to http://localhost:3000/ in order to start the application.

If you need to specify an alternate port number, use the environment variable
`PORT`. For example, to specify port 3001, run `PORT=3001 node demo`.

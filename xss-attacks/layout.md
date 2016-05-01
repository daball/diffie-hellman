## Project Structure

/client.js
: Entry-point for Chat Client. Use `node client` to run it. Use `PORT=8081 node client` to choose a TCP port. Handles cryptographic calls for client-to-client peer-to-peer encryption via Diffie-Hellman exchanges.

/server.js
: Entry-point for Chat Server. Use `node server` to run it. Use `PORT=8080 node server` to choose a TCP port.

/chat
: ChatServer and ChatClient terminal chat subsystem.

/controller
: MVC controllers for Chat Server and Chat Client interaction between entry-points, terimal chat subsystems.

/crypto
: Contains Diffie-Hellman algorithm, Caesar cipher algorithm, and a wrapper for AES-256 for use by Chat Client and Chat Relay Server subsystems.

/crypto/primes
: A directory with the first 50 million known prime numbers, separated into 50 files. Used by Diffie-Hellman to generate random primes. Sourced from https://primes.utm.edu/lists/small/millions/.

/demo
: A set of scripts used during live demonstration.

/wwwroot
: Contains the front-end views for each of the three applications.

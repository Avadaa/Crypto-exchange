# Cryptocurrency exchange

http://www.ezgainsonline.com/#/

Pictures: https://imgur.com/a/k354i9C

Socket.io might have some problems connecting if the client using a sock5 proxy.

A site which works a lot like a stock exchange. Users can deposit money and trade using those funds. Everything works with real world currency (crypto: Ethereum and Tether). The project was made for educational purposes only, and is not meant for actual trading. Stuff I learned:

- Web application file structure
- Vue
- Socket.io
- Databases in web development
- Basics of writing a trading engine from scratch
- Basics of coding an API
- Two factor authentication
- Ethereum-network transactions
- Domains
- AWS (S3, Elastic beanstalk, Route 53)

Things I didn't focus on:
- Security
- Aesthetic front-end design
- Wrote some parts of the code late at night, and later on didn't find a more beautiful way to rewrite those lines

The backend is running separated from the front, so basically if I provided documentation, users could push trades through using their own bots / algorithms. Backend is fully written using NodeJS. Front-end was built with Vue and scss.

Features:
- Registeration
- Login
- Deposit (ETH, USDT)
- Withdraw to custom addresses (ETH, USDT)
- Orders (limit, market)
- Order history
- A market maker algorithm which provides liquidity and follows the world market movements (the algo itself has some interesting features too)
- Users can upload custom avatars
- Two factor authentication on login
- Users can change their username and password

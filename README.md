Home task 

1. Please create simple ERC20 token (you can reuse one from the previous home task);
2. Please create an auction contract, where I can make the bid in ETH:
   - Min bid for the auction contract is 0.01 eth;
   - Each bid must be > then previous; 
   - As a user I should be able to see the details of my bid;
   - Max amount of bids - 20, when there is 21 bid, the bid with the smallest amount must be removed and Eth must be sent back to the bidder;

3. Auction must have start date and duration (in timestamp);
4. User can't bid if auction has not started yet or if it's already finished;
5. 1 user can do 3 bids maximum in total;
6. When auction is finished, the last 3 bidders (winners) should be able to withdraw ERC20 tokens (which is at point 1) from the contract in proportion (50% for the 1 place, 30% for the 2nd, 20% for the 3rd);
7. Cover everything by unit tests;

```shell
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat test
npx hardhat node
npx hardhat run --network {network} scripts/deploy.js
npx hardhat verify --contract "contracts/KarpunetsToken.sol:KarpunetsToken" --network {network} {address}
npx hardhat help
```

.env file
```dotenv
ALCHEMY_KEY=
ETHERSCAN_API_KEY=
PRIVATE_KEY_TESTNET=
```
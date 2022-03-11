import React, { useEffect, useState, useRef } from "react";
import { ethers } from "ethers";
import "./App.css";
import abi from "./utils/ForeverWave.json";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFreeCodeCamp,
  faGithub,
  faTwitter,
} from "@fortawesome/free-brands-svg-icons";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";

const App = () => {
  const contractAddress = "0xd2c60143Bc9cBCD28BDdBFd357ec9A24F38259e3";
  const contractABI = abi.abi;

  // state variables

  const [currentAccount, setCurrentAccount] = useState("");
  const [allWaves, setAllWaves] = useState([]);
  const [waveCount, updateWaveCount] = useState("");
  const [mining, setMiningStatus] = useState("");
  const [msg, setMessage] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const [checked, setChecked] = useState(false);
  const [status, changeStatus] = useState("danger");
  const [waveContract, setWaveContract] = useState(null);
  const [loadMoreDisplay, setLoadMoreDisplay] = useState(false);
  const [displayItems, setDisplayItems] = useState(7);
  const [btn, setBtn] = useState({ disabled: false, opacity: 1 });

  // function for loading more messages

  const loadMore = () => {
    setDisplayItems(displayItems + 7);
    console.log(displayItems);
  };

  // function to make sure users have acknowledged testnet notice

  const notice = () => {
    if (status === "success") {
      changeStatus("danger");
    } else {
      changeStatus("success");
    }
    setChecked((old) => !old);
  };

  // function to save solidity wave contract in state if present

  const checkContract = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const foreverWaveContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );
        setWaveContract(foreverWaveContract);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // function to add delay for error messages disappearing

  const delayedMsg = (msg, time) => {
    setErrMsg(msg);
    setTimeout(() => {
      setErrMsg("");
    }, time);
  };

  // function for checking whether user is connected to correct blockchain

  const checkChain = async (chainName) => {
    const chains = {
      Rinkeby: "0x4",
      Ropsten: "0x3",
    };

    let chainId = await ethereum.request({ method: "eth_chainId" });
    console.log("Connected to chain " + chainId);

    const appChainId = chains[chainName];
    console.log(appChainId);

    if (chainId !== appChainId) {
      delayedMsg(
        `Please make sure your wallet is connected to the ${chainName} Test Network`,
        2000
      );
      return false;
    }
    return true;
  };

  const getAllWaves = async () => {
    try {
      const waves = await waveContract.getAllWaves();

      let wavesCleaned = [];
      waves.forEach((wave) => {
        wavesCleaned.unshift({
          address: wave.waver,
          timestamp: new Date(wave.timestamp * 1000),
          message: wave.message,
        });
      });
      setAllWaves(wavesCleaned);
      setLoadMoreDisplay(true);

      if (!wavesCleaned.length > 0) {
        updateWaveCount("Zero");
      } else {
        updateWaveCount(wavesCleaned.length);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // add wave event listener

  useEffect(() => {
    const onNewWave = (from, timestamp, message) => {
      console.log("NewWave", from, timestamp, message);
      getAllWaves();
    };

    if (!waveContract) return;

    console.log("Wave contract found. Adding listener...");
    console.log("retrieving waves...");

    getAllWaves();

    waveContract.on("NewWave", onNewWave);

    return () => {
      if (waveContract) {
        waveContract.off("NewWave", onNewWave);
      }
    };
  }, [waveContract]);

  // check if users wallet is connected

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        console.log(
          "Please make sure you are signed into Metamask before using this dApp."
        );
        return;
      }

      console.log("We have the ethereum object", ethereum);
      const chain = await checkChain("Rinkeby");
      if (!chain) return;

      // check if we are authorised to check user's wallet

      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log(`Authorised account ${account} found.`);
        setCurrentAccount(account);
        checkContract();
      } else {
        console.log("No authorised account found.");
      }
    } catch (error) {
      console.log(error);
    }
  };

  // add connect wallet method

  const connectWallet = async () => {
    try {
      if (!checked)
        return delayedMsg("Please first acknowledge the notice below", 3000);

      const { ethereum } = window;

      if (!ethereum)
        return alert(
          "Please make sure you have installed Metamask before conneting."
        );

      const chain = await checkChain("Rinkeby");

      if (!chain) return;

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      console.log("connected", accounts[0]);
      setCurrentAccount(accounts[0]);
      checkContract();
    } catch (error) {
      console.log(error);
    }
  };

  // wave function

  const wave = async () => {
    setBtn({ disabled: true, opacity: 0.5 });
    try {
      if (!msg.length > 0)
        return delayedMsg("Please wave with a message", 2000);

      if (msg.length > 200)
        return delayedMsg(
          "Please do not write more than 200 characters.",
          2000
        );

      const { ethereum } = window;

      if (!ethereum)
        return alert(
          "Please make sure you are signed into Metamask before using this dApp."
        );

      const chain = await checkChain("Rinkeby");
      if (!chain) return;
      if (!waveContract) return;

      let count = await waveContract.getTotalWaves();
      console.log(`received a total of ${count.toNumber()} waves`);

      // execute wave

      // first estimate gas to allow for smoother transaction

      const startEstimate = await waveContract.estimateGas.wave(msg);
      console.log("Estimated Gas Limit:", startEstimate.toString());

      const waveTxn = await waveContract.wave(msg, {
        gasLimit: startEstimate,
      });
      console.log("mining...", waveTxn.hash);
      setMiningStatus("Waving");
      await waveTxn.wait();
      console.log("mining complete!", waveTxn.hash);
      setMiningStatus("Wave Complete");
      setTimeout(() => {
        setMiningStatus("");
      }, 1000);
      setMessage("");
    } catch (error) {
      setMiningStatus("");
      console.log(error.code);
      setBtn({ disabled: false, opacity: 1 });

      if (error.code === "UNPREDICTABLE_GAS_LIMIT")
        return delayedMsg(
          "Please wait 5 minutes between sending messages.",
          2000
        );
      if (error.code === "UNSUPPORTED_OPERATION")
        return delayedMsg(
          "Please connect your wallet befor sending your message.",
          2000
        );

      return delayedMsg("An error occured, please try again.", 2000);
    }
    setBtn({ disabled: false, opacity: 1 });
  };

  useEffect(() => {
    if (allWaves) {
      if (displayItems >= allWaves.length) {
        setLoadMoreDisplay(false);
      }
    }
  }, [loadMore]);

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  const renderContent = () => {
    if (!currentAccount) {
      return (
        <div>
          <div className="connectContainer">
            <button className="waveButton" onClick={connectWallet}>
              CONNECT
            </button>
          </div>
          <div id="cont">
            <div id="notice">
              <p id="notice-text">
                Forever Wave lives on Ethereum's Rinkeby Test Network.{" "}
                <strong>Never</strong> send real Eth to your testnet address. If
                you did, you would lose it.{" "}
                <a
                  href="https://medium.com/compound-finance/the-beginners-guide-to-using-an-ethereum-test-network-95bbbc85fc1d"
                  target="_blank"
                >
                  Testnets
                </a>{" "}
                use test Eth which you can get for free from{" "}
                <a href="https://faucets.chain.link/rinkeby" target="_blank">
                  Chainlink
                </a>{" "}
                or other faucets. It is recommended that you create a separate
                wallet for use on test networks.
              </p>
              <div id="checkbox-block">
                <button
                  type="button"
                  className={`btn btn-${status}`}
                  onClick={notice}
                >
                  Acknowledge
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div>
          {mining && (
            <div>
              <p className="mining">{mining}</p>
              <p className="loader"></p>
            </div>
          )}
          <div id="message-box">
            <input
              id="message"
              type="text"
              required
              value={msg}
              placeholder="Enter your message here"
              className="input-box"
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <div className="connectContainer">
            <button
              className="waveButton"
              onClick={wave}
              disabled={btn.disabled}
              style={{ opacity: btn.opacity }}
            >
              WAVE
            </button>
          </div>
          {waveCount && (
            <div>
              <p className="waveCount">{waveCount} waves so far!</p>
            </div>
          )}
          <div>
            {allWaves.slice(0, displayItems).map((wave, index) => {
              return (
                <div
                  key={index}
                  style={{
                    background: `linear-gradient(115deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.3))`,
                    color: "#002266",
                    marginTop: "16px",
                    marginBottom: "16px",
                    padding: "8px",
                    fontSize: "1rem",
                  }}
                  className="messages"
                >
                  <div>
                    <u>From:</u> {wave.address}
                  </div>
                  <div>
                    <u>Time:</u> {wave.timestamp.toString()}
                  </div>
                  <div
                    style={{
                      fontFamily: "Zhi Mang Xing",
                      fontSize: "1.8rem",
                      marginTop: "10px",
                    }}
                  >
                    {wave.message}
                  </div>
                </div>
              );
            })}
            {loadMoreDisplay && (
              <div id="load-more">
                <button className="waveButton" onClick={loadMore}>
                  Load More
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }
  };

  return (
    <div id="head-container">
      <div className="mainContainer">
        <div className="dataContainer">
          <div className="header">Forever Wave</div>
          <div className="bio">
            <p>
              Welcome to the <strong>Forever Wave dApp</strong>. dApps are
              decentralised applications which live on the{" "}
              <a
                href="https://en.wikipedia.org/wiki/Blockchain"
                target="_blank"
              >
                <strong>blockchain</strong>.
              </a>
            </p>
            <p>
              Once you connect your wallet, you'll be able to give me a{" "}
              <strong>wave</strong>, send me a <strong>message</strong> and view
              all everybody else's. There's also a chance you'll win some
              Rinkeby test <strong>Eth</strong> &#128512;.
            </p>
            <p>
              Finally, be careful what you write as your message will be
              recorded <strong>forever</strong> on the{" "}
              <a
                href="https://rinkeby.etherscan.io/address/0xd2c60143Bc9cBCD28BDdBFd357ec9A24F38259e3"
                target="_blank"
              >
                <strong>chain!</strong>
              </a>{" "}
              Muhaha!
            </p>
          </div>
          {errMsg && (
            <div>
              <p className="errMsg">{errMsg}</p>
            </div>
          )}
          <div>{renderContent()}</div>
          <div id="contact-block">
            <p id="designer">developed by Scott Mitchell</p>
            <a
              href="https://github.com/scott-a-m"
              target="_blank"
              rel="noreferrer"
            >
              <FontAwesomeIcon
                icon={faGithub}
                size="2x"
                border
                className="contact-icon"
              />
            </a>
            <a
              href="https://twitter.com/scotts-dev"
              target="_blank"
              rel="noreferrer"
            >
              <FontAwesomeIcon
                icon={faTwitter}
                size="2x"
                border
                className="contact-icon"
              />
            </a>
            <a
              href="https://www.freecodecamp.org/scott-a-m"
              target="_blank"
              rel="noreferrer"
            >
              <FontAwesomeIcon
                icon={faFreeCodeCamp}
                size="2x"
                border
                className="contact-icon"
              />
            </a>
            <a href="mailto:scott_a_mitchell@163.com">
              <FontAwesomeIcon
                icon={faEnvelope}
                size="2x"
                border
                className="contact-icon"
              />
            </a>
            <p style={{ marginTop: "2rem" }}>
              with{" "}
              <a href="https://buildspace.so/" target="_blank">
                Buildspace
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;

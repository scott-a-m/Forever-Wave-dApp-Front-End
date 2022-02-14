import React, { useEffect, useState, useRef } from "react";
import { ethers } from "ethers";
import "./App.css";
import abi from "./utils/ForeverWave.json";

const App = () => {
  // creat state variable used to store user's public wallet

  const [currentAccount, setCurrentAccount] = useState("");
  const contractAddress = "0xd2c60143Bc9cBCD28BDdBFd357ec9A24F38259e3";
  const contractABI = abi.abi;

  const [allWaves, setAllWaves] = useState([]);
  const [waveCount, updateWaveCount] = useState("");
  const [mining, setMiningStatus1] = useState("");
  const [miningComplete, setMiningStatus2] = useState("");
  const [msg, setMessage] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const [checked, setChecked] = useState(false);
  const [status, changeStatus] = useState("danger");

  const notice = () => {
    if (status === "success") {
      changeStatus("danger");
    } else {
      changeStatus("success");
    }

    setChecked((old) => !old);
  };

  const checkChain = async () => {
    let chainId = await ethereum.request({ method: "eth_chainId" });
    console.log("Connected to chain " + chainId);
    const appChainId = "0x4";
    if (chainId !== appChainId) {
      setErrMsg(
        "Please make sure your wallet is connected to the Rinkeby Test Network"
      );
      setTimeout(() => {
        setErrMsg("");
      }, 2000);
      return false;
    } else {
      return true;
    }
  };

  const getAllWaves = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        console.log("getting waves for you!");
        const foreverWaveContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        const waves = await foreverWaveContract.getAllWaves();

        let wavesCleaned = [];
        waves.forEach((wave) => {
          wavesCleaned.unshift({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message,
          });
        });
        setAllWaves(wavesCleaned);

        if (!wavesCleaned.length > 0) {
          updateWaveCount("Zero");
        } else {
          updateWaveCount(wavesCleaned.length);
        }
      } else {
        console.log("Ethereum object does not exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  // add listener

  useEffect(() => {
    let foreverWaveContract;

    const onNewWave = (from, timestamp, message) => {
      console.log("NewWave", from, timestamp, message);
      getAllWaves();
    };

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const foreverWaveContract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );
      foreverWaveContract.on("NewWave", onNewWave);
    }

    return () => {
      if (foreverWaveContract) {
        foreverWaveContract.off("NewWave", onNewWave);
      }
    };
  }, []);

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        console.log(
          "Please make sure you are signed into Metamask before using this dApp."
        );
        return;
      }

      const chain = await checkChain();

      if (!chain) {
        return;
      }

      console.log("We have the ethereum object", ethereum);

      // check if we are authorised to check user's wallet

      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log(`Authorised account ${account} found.`);
        setCurrentAccount(account);
        getAllWaves();
        console.log("getting waves");
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
      if (!checked) {
        setErrMsg("Please first acknowledge the notice below");
        setTimeout(() => {
          setErrMsg("");
        }, 3000);
        return;
      }

      const { ethereum } = window;
      if (!ethereum) {
        alert("Please make sure you have installed Metamask before conneting.");
        return;
      }

      const chain = await checkChain();

      if (!chain) {
        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      console.log("connected", accounts[0]);
      setCurrentAccount(accounts[0]);
      setErrMsg("");
      console.log("getting waves");
      getAllWaves();
    } catch (error) {
      console.log(error);
    }
  };

  const wave = async () => {
    try {
      if (!msg.length > 0) {
        setErrMsg("Please wave with a message.");
        setTimeout(() => {
          setErrMsg("");
        }, 2000);
        return;
      }

      if (msg.length > 200) {
        setErrMsg("Please do not write more than 200 characters.");
        setTimeout(() => {
          setErrMsg("");
        }, 2000);
        return;
      }

      const { ethereum } = window;

      if (!ethereum) {
        alert(
          "Please make sure you are signed into Metamask before using this dApp."
        );
        return;
      } else if (ethereum) {
        const chain = await checkChain();

        if (!chain) {
          return;
        }

        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const foreverWaveContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );
        let count = await foreverWaveContract.getTotalWaves();

        console.log(`received a total of ${count.toNumber()} waves`);

        // execute wave

        const startEstimate = await foreverWaveContract.estimateGas.wave(msg);
        console.log("Estimated Gas Limit:", startEstimate.toString());

        const waveTxn = await foreverWaveContract.wave(msg, {
          gasLimit: startEstimate,
        });
        console.log("mining...", waveTxn.hash);
        updateWaveCount("");
        setMiningStatus1("mining");
        await waveTxn.wait();
        console.log("mining complete!", waveTxn.hash);
        setMiningStatus1("");
        setMiningStatus2("mining complete");
        setTimeout(() => {
          setMiningStatus2("");
        }, 500);
      } else {
        console.log("Ethereum object doesn't exist");
      }
    } catch (error) {
      if (error.code === "UNPREDICTABLE_GAS_LIMIT") {
        console.log("Please wait 5 minutes between sending messages.");
        setErrMsg("Please wait 5 minutes between sending messages.");
        setTimeout(() => {
          setErrMsg("");
        }, 2000);
      } else if (error.code === "UNSUPPORTED_OPERATION") {
        console.log("Please connect your wallet befor sending your message.");
        setErrMsg("Please connect your wallet befor sending your message.");
        setTimeout(() => {
          setErrMsg("");
        }, 2000);
      } else {
        setMiningStatus1("");
        setErrMsg("An error occured. Please try again");
        setTimeout(() => {
          setErrMsg("");
        }, 2000);
        console.log(error.code);
      }
    }
  };

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
              <p className="mining">Waving</p>
              <p className="loader"></p>
            </div>
          )}
          {miningComplete && (
            <div>
              <p className="mining">Wave Complete!</p>
            </div>
          )}
          <div id="message-box">
            <input
              id="message"
              type="text"
              required
              placeholder="Enter your message here"
              className="input-box"
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <div className="connectContainer">
            <button className="waveButton" onClick={wave}>
              WAVE
            </button>
          </div>
          {waveCount && (
            <div>
              <p className="waveCount">{waveCount} waves so far!</p>
            </div>
          )}
          <div>
            {allWaves.map((wave, index) => {
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
          </div>
        </div>
      );
    }
  };

  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">Forever Wave</div>
        <div className="bio">
          <p>
            Welcome to the <strong>Forever Wave dApp</strong>. dApps are
            decentralised applications which live on the{" "}
            <a href="https://en.wikipedia.org/wiki/Blockchain" target="_blank">
              <strong>blockchain</strong>.
            </a>
          </p>
          <p>
            Once you connect your wallet, you'll be able to give me a{" "}
            <strong>wave</strong>, send me a <strong>message</strong> and view
            all everybody else's. There's also a chance you'll win some Rinkeby
            test <strong>Eth</strong> &#128512;.
          </p>
          <p>
            Finally, be careful what you write as your message will be recorded{" "}
            <strong>forever</strong> on the{" "}
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
      </div>
    </div>
  );
};

export default App;

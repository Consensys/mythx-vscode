MythXvsc is an extension for running MythX services from your favourite IDE.

The extensions provides:

-   Smart contract compilation (via `solidity` VSCode extension)
-   Log in to MythX API
-   AST extraction from compiled source
-   Submission of analysis

## Instructions

After installing the extension please enter your registered MythX ethAddress and password in VSCode settings as shown in the screenshots below:

#####################ADD SCREESNSHOTS

**Please note that the credentials stored this way are exposed to VSCode. Be sure to understand the security risk this could create or contact the extension developers if you don't. We are working on a more secure log-in implementation**

If no log in is provided the extension will fallback to use default trial `ethAddress` and `password` for MythX.

Now simply open a `.sol` file and click on the `MythX Analyze Smart Contract` button that you will see in the top right of your IDE window:

#####################ADD SCREESNSHOTS

Once solidity compilation is done you will be prompted to enter the name of the contract you want to analyze (you can just copy and paste the name from your code). It is very important that you enter the correct name or the API will return an error and your analysis will fail.

#####################ADD SCREESNSHOTS

Now you can just seat back and wait for MythX to do its magic :) Once analysis is over you will see your smart contract issues highlighted in your code. This should take no longer than three minutes.

#####################ADD SCREESNSHOTS

## Known bugs

-   Analysis fails straight away on some contract. This is most likely caused by the API not accepting some input. Please contact the extension developer with a copy of the smart contract in order for us to investigate further.

## Features that will be implemented in the future

-   Logout from MythX
-   Full analysis mode
-   Multiple files submission
-   Detailed report

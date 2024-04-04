<p align="center">
<img src="https://raw.githubusercontent.com/airicyu/solstage-web/main/img/solstage-logo.png" width="100">
</p>

# Solstage

Welcome to Solstage, a platform about NFTs management and filtering categories display.

What you can do:
- Manage your NFTs and put under some categories.
- Manage your own profile to shown some favourite NFTs.
- Visiting other people's NFTs profilee.

Project resources:

- Website: https://solstage.github.io/
- Web UI repo: https://github.com/airicyu/solstage-web
- Sharing Deck: https://www.loom.com/share/6c6b82ac5bd44a8fa32cac56c1907db6?sid=0aac1051-a332-4cfa-8cbe-0df56361daaf

----------

# The Problem

<p align="center">
<img src="https://raw.githubusercontent.com/airicyu/solstage-web/main/img/the_problem.png" width="1000">
</p>

You may have some cool NFTs. But when you look at your wallet, it is jammed by many Ads NFTs & SCAM NFTs. It is annoying.

"Can we just see our favourite/normal NFTs?"

"Can we put those Ads/SCAMS in junkbox?"

----------

# Our Solution is Simple

- We defined 3 categories:
  - "Stage", "Backstage" and "Junkbox".
- You can freely put your NFTs in these categories.

<p align="center">
<img src="https://raw.githubusercontent.com/airicyu/solstage-web/main/img/how_to_solve.png" width="1000">
</p>

## The Categories

### STAGE - The One place to show off your NFTs

- You select what NFTs to show on the `Stage`! It's your trophy room!
- The other people visiting your profile will see your `Stage` only.

### BACKSTAGE

- A place to put your normal NFTs.
- They may not be your favourite, but you still want to put them in a place.

### JUNKBOX

- By default all NFTs will fall in `JUNKBOX`. So, Ads or SCAMs would be in junkbox by default.

----------

# Testing Guide

## 1. Setup Shadow Drive Storage Account.

Because we store the config data on Shadow Drive. So you need to setup the storage account first.

i) You need to have a fews $SHDW in your wallet. (e.g: 0.01 $SHDW)

ii) Then you need to go to Shadow drive's portal at https://portal.shdwdrive.com/ .

iii) You need to create a storage account. The account name must be "solstage". Create it with 100KB is plenty enough.

like below:

<p align="center">
<img src="https://raw.githubusercontent.com/airicyu/solstage-web/main/img/shadow_portal_setup_storage_acc.png" width="1000">
</p>

## 2. Go to the website and play around

Website URL: https://solstage.github.io/

i) Connect your wallet.

ii) Search your wallet to see your own profile

iii) If its the first time, you will see all your NFTs are fall into `Junkbox`.

iv) You may move the NFTs to `Stage` or `Backstage` by click the icon buttons under NFT card.

v) When you move the NFTs, you may need to sign/approve some transactions. If it is your first time to operate, the initial movement may need several sign/approval to work.

vi) You will then see the NFTs moved to the desired categories!

<p align="center">
<img src="https://raw.githubusercontent.com/airicyu/solstage-web/main/img/web_demo.png" width="1000">
</p>

## 3. Visiting the other people's profile (View Mode)

i) Click the website menu's "Home".

ii) Copy the other people's wallet address into the search bar and search.

iii) You will then go to their wallet profile page.

It is not your wallet, so you will see their profile in `View Mode`.

### View Mode

`View Mode` is a mode that you are visiting the others profile.
- You cannot change the other people's categorization setup. 
- Only the `Stage` categories NFTs are shown.
 
Given that the stranger has already managed their own profile's `Stage`. Then you will end up seeing their profile like below:

<p align="center">
<img src="https://raw.githubusercontent.com/airicyu/solstage-web/main/img/web_demo.png" width="1000">
</p>

----------

# Project roadmap

## Done
- UI to display wallet NFTs profile.
- Ability to categorizing NFTs into Stage, Backstage, Junkbox.
- Allow move NFTs between categories.
- Allow to view other people's wallet address in VIEW mode.

## TODO
- Polish Stage UI to be more attractive. The `Stage` should be more sexy.
- Provide batch updates so multiple move operation can be done by only 1 sign approve transaction.

## Long term TODO

- Provide some interaction between users. It could be something like users may "likes" anyone's Stage profile when they visit.

- Provide an open standard for NFT pinning (Like the stage). So Wallet Apps, DApps can make use of our filter for better display UX to the user.
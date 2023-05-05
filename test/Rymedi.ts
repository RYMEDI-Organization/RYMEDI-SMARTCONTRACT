import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { contractDeployment, hash } from './deploy';


describe("Rymedi", function () {
    // We define a fixture to reuse the same setup in every test.
    // We use loadFixture to run this setup once, snapshot that state,
    // and reset Hardhat Network to that snapshot in every test.

    async function deploymentFixture() {

        const { contract, proxyContract, logicContract } = await contractDeployment();
        const signers = await ethers.getSigners();
        
        // Connect the contract instance to a signer
        const [owner, admin, sender1, sender2, sender3] = await ethers.getSigners();
        console.log("signersssssssssssssss", owner.address, admin.address, sender1.address, sender2.address, sender3.address);
        // const contractWithOwner = contract.connect(owner);
        // const contractWithAdmin = contract.connect(admin);
        // const contractWithSender1 = contract.connect(sender1);
        // Connect the contract instance to a signer
        // const signer = await ethers.provider.getSigner();
        // const contractWithSigner = contract.connect(signer);
        // console.log("contractWithSigner", contractWithSigner);

        // const result = await contractWithSigner.initialized.call();
        // console.log("result", result)

        // Call the addRecord function on the logic contract through the proxy contract
        // const add = await contractWithSigner.addRecord(
        //     "0xab1f7b7600761ef53800ccb5fd8b18827e4e7f191534d11a33ebbfa5482b767f",
        //     "0xd4a9ed9a766b3f61d12b3e899421b2487040d960a6b1d7ffa3d18cbb97a57e34"
        // );
        // console.log(add, "1");

        // // method for getting the record
        // const value = await contractWithSigner.getRecord(
        //     "0xab1f7b7600761ef53800ccb5fd8b18827e4e7f191534d11a33ebbfa5482b767f"
        // );
        // console.log(value, "2");

        // //updating the code of smart contract by passing new smartContract address
        // // const update = await contractWithSigner.updateCode(logicContract1.address);
        // // console.log(update)

        // //method for removing the record
        // const remove = await contractWithSigner.removeRecord("0xab1f7b7600761ef53800ccb5fd8b18827e4e7f191534d11a33ebbfa5482b767f");
        // console.log(remove, "3")

        // // method for getting the record
        // const valueAgain = await contractWithSigner.getRecord(
        //     "0xab1f7b7600761ef53800ccb5fd8b18827e4e7f191534d11a33ebbfa5482b767f"
        // );
        // console.log(valueAgain, "4");
        return { contract, proxyContract, logicContract, owner, admin, sender1, sender2, sender3 };
        // return { contract, proxyContract, logicContract, contractWithAdmin, contractWithOwner, contractWithSender1 };
    }

    describe("Add Records", function () {
        it("push records", async function () {
            const { contract, owner, admin, sender1, sender2, sender3 } = await loadFixture(deploymentFixture);
            // console.log("1====================", contract)
            const contractWithOwner = contract.connect(owner);
            const contractWithAdmin = contract.connect(admin);
            const contractWithSender1 = contract.connect(sender1);
            const contractWithSender2 = contract.connect(sender2);
            // Connect the contract instance to a signer
            // const signer = await ethers.provider.getSigner();
            // const contractWithSigner = contract.connect(signer);
            // console.log("contractWithSigner", contractWithSigner);

            // Call the addRecord function on the logic contract through the proxy contract
            const isOwner = await contractWithOwner.isOwner(owner.address);
            const isAdmin = await contractWithOwner.isOwner(admin.address);
            // const setAdmin = await contractWithOwner.assignAdmin(admin.address);
            console.log(isOwner, isAdmin, "==================")
            expect(isOwner).to.equal(true);
            expect(isAdmin).to.equal(false);

            const setAdmin = await contractWithOwner.setAdmin(admin.address);
            const isAdminR = await contractWithAdmin.isAdmin(admin.address);
            expect(isAdminR).to.equal(true);

            console.log("======ppppppp=======");
            const setSender1 = await contractWithAdmin.setSender(sender1.address);
            console.log("======uuuuuuuuuuuuu=======");
            const setSender2 = await contractWithAdmin.setSender(sender2.address);
            console.log(setSender1, "======tttttt=======", setSender2);
            // const k1 = hash("k1");
            // const v1 = ethers.utils.sha256("v1");
            console.log( "---hh-----")
            const send1 = await contractWithSender1.addRecord(hash("k1"), hash("v1"));
            const get1 = await contractWithAdmin.getRecord(hash("k1"));
            const get2 = await contractWithAdmin.getRecord(hash("v1"));
            console.log(get1, get2, "======ppppppp=======");
            expect(get1).to.equal(hash("v1"));
            expect(get2).to.equal("0x0000000000000000000000000000000000000000000000000000000000000000");

            const send2 = await contractWithSender2.addRecord(hash("k2"), hash("v2"));
            const get3 = await contractWithAdmin.getRecord(hash("k2"));
            const get4 = await contractWithAdmin.getRecord(hash("v2"));
            console.log(get3, get4, "======lllllllllllllllllll=======");
            expect(get3).to.equal(hash("v2"));
            expect(get4).to.equal("0x0000000000000000000000000000000000000000000000000000000000000000");

            const send3 = await contractWithSender2.addBulkRecords([hash("k3"),hash("k4")], [hash("v3"),hash("v4")]);
            const get5 = await contractWithAdmin.getRecord(hash("k3"));
            const get6 = await contractWithAdmin.getRecord(hash("k4"));
            console.log(get5, get6, "======kkkkkkkkkkkkkkkkk=======");
            expect(get5).to.equal(hash("v3"));
            expect(get6).to.equal(hash("v4"));

            const remove1 = await contractWithOwner.removeRecord(hash("k4"));
            const getR1 = await contractWithAdmin.getRecord(hash("k4"));
            expect(getR1).to.equal("0x0000000000000000000000000000000000000000000000000000000000000000");
            console.log(getR1, "======cccccccccccc=======");

            const rev1 = await contractWithAdmin.revokeSender(sender1.address);
            const res1 = await contractWithSender1.isSender(sender1.address)
            expect(res1).to.equal(false);

            const transferOwnerhip = await contractWithOwner.transferOwnership(sender1.address)
            expect(await contractWithOwner.isOwner(sender1.address)).to.equal(true);
            console.log("ffffffffffffffffffff")
            // const send4 = await contractWithSender1.addRecord(hash("k5"), hash("v5"));
            // const get7 = await contractWithAdmin.getRecord(hash("k5"));
            // // const get2 = await contractWithAdmin.getRecord(hash("v1"));
            // console.log(get7, send4, "======ppppppp=======");
            // expect(get7).to.equal(hash("k5"));
            // expect(get2).to.equal("0x0000000000000000000000000000000000000000000000000000000000000000");

        });

    });
});

import { ethers } from "hardhat";
import { ContractFactory, Contract } from "ethers";

export async function deployContract(name: string, ...parameters: any[]): Promise<{ Contract: ContractFactory; contract: Contract; }> {
  const Contract: ContractFactory = await ethers.getContractFactory(name);
  const contract: Contract = await Contract.deploy(...parameters);
  await contract.deployed();

  return { Contract, contract };
}

export function milliSeconds2Seconds(milliSeconds: number): number {
  return Math.round(milliSeconds / 1000);
}

export function timer(duration: number) {
  return new Promise(res => setTimeout(res, duration));
}

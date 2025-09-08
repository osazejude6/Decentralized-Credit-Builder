import { describe, it, expect, beforeEach } from "vitest";
import { stringAsciiCV, uintCV } from "@stacks/transactions";

const ERR_NOT_AUTHORIZED = 100;
const ERR_PROFILE_ALREADY_EXISTS = 101;
const ERR_PROFILE_NOT_FOUND = 102;
const ERR_INVALID_SCORE = 103;
const ERR_INVALID_LOAN_COUNT = 104;
const ERR_INVALID_REPAID_AMOUNT = 105;
const ERR_INVALID_TIMESTAMP = 106;
const ERR_INVALID_INCOME = 107;
const ERR_INVALID_ASSET_VALUE = 108;
const ERR_INVALID_HISTORY_ENTRY = 109;
const ERR_MAX_HISTORY_EXCEEDED = 110;
const ERR_INVALID_UPDATE_PARAM = 111;
const ERR_AUTHORITY_NOT_VERIFIED = 112;
const ERR_INVALID_VERIFICATION_SOURCE = 113;
const ERR_INVALID_CREDIT_FACTOR = 114;
const ERR_INVALID_PENALTY_FACTOR = 115;
const ERR_INVALID_MIN_SCORE = 116;
const ERR_INVALID_MAX_SCORE = 117;
const ERR_INVALID_ORACLE_PRINCIPAL = 118;
const ERR_INVALID_DID = 119;
const ERR_INVALID_STATUS = 120;
const ERR_INVALID_CURRENCY = 121;
const ERR_INVALID_LOCATION = 122;
const ERR_INVALID_AGE = 123;
const ERR_INVALID_EMPLOYMENT_STATUS = 124;
const ERR_INVALID_EDUCATION_LEVEL = 125;

interface CreditProfile {
  did: string;
  creditScore: number;
  loanCount: number;
  totalRepaid: number;
  totalBorrowed: number;
  lastUpdated: number;
  income: number;
  assetValue: number;
  age: number;
  employmentStatus: string;
  educationLevel: string;
  location: string;
  currency: string;
  status: boolean;
}

interface HistoryEntry {
  timestamp: number;
  scoreChange: number;
  reason: string;
  verifier: string;
}

interface Result<T> {
  ok: boolean;
  value: T;
}

class CreditProfileContractMock {
  state: {
    profileCounter: number;
    minScore: number;
    maxScore: number;
    creditFactor: number;
    penaltyFactor: number;
    maxHistoryEntries: number;
    authorityContract: string | null;
    oraclePrincipal: string | null;
    creditProfiles: Map<string, CreditProfile>;
    profileHistory: Map<string, Map<number, HistoryEntry>>;
    historyCounters: Map<string, number>;
  } = {
    profileCounter: 0,
    minScore: 0,
    maxScore: 1000,
    creditFactor: 10,
    penaltyFactor: 20,
    maxHistoryEntries: 50,
    authorityContract: null,
    oraclePrincipal: null,
    creditProfiles: new Map(),
    profileHistory: new Map(),
    historyCounters: new Map(),
  };
  blockHeight: number = 0;
  caller: string = "ST1TEST";

  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      profileCounter: 0,
      minScore: 0,
      maxScore: 1000,
      creditFactor: 10,
      penaltyFactor: 20,
      maxHistoryEntries: 50,
      authorityContract: null,
      oraclePrincipal: null,
      creditProfiles: new Map(),
      profileHistory: new Map(),
      historyCounters: new Map(),
    };
    this.blockHeight = 0;
    this.caller = "ST1TEST";
  }

  getProfile(user: string): Result<CreditProfile | null> {
    return { ok: true, value: this.state.creditProfiles.get(user) || null };
  }

  getHistoryEntry(user: string, entryId: number): Result<HistoryEntry | null> {
    const history = this.state.profileHistory.get(user);
    return { ok: true, value: history ? history.get(entryId) || null : null };
  }

  getHistoryCount(user: string): Result<number> {
    return { ok: true, value: this.state.historyCounters.get(user) || 0 };
  }

  getMinScore(): Result<number> {
    return { ok: true, value: this.state.minScore };
  }

  getMaxScore(): Result<number> {
    return { ok: true, value: this.state.maxScore };
  }

  setAuthorityContract(contractPrincipal: string): Result<boolean> {
    if (contractPrincipal === "SP000000000000000000002Q6VF78") {
      return { ok: false, value: false };
    }
    if (this.state.authorityContract !== null) {
      return { ok: false, value: false };
    }
    this.state.authorityContract = contractPrincipal;
    return { ok: true, value: true };
  }

  setOraclePrincipal(oracle: string): Result<boolean> {
    if (oracle === "SP000000000000000000002Q6VF78") {
      return { ok: false, value: false };
    }
    if (!this.state.authorityContract) {
      return { ok: false, value: false };
    }
    if (this.caller !== this.state.authorityContract) {
      return { ok: false, value: false };
    }
    this.state.oraclePrincipal = oracle;
    return { ok: true, value: true };
  }

  setMinScore(newMin: number): Result<boolean> {
    if (!this.state.authorityContract) return { ok: false, value: false };
    if (this.caller !== this.state.authorityContract) return { ok: false, value: false };
    if (newMin > this.state.maxScore) return { ok: false, value: false };
    this.state.minScore = newMin;
    return { ok: true, value: true };
  }

  setMaxScore(newMax: number): Result<boolean> {
    if (!this.state.authorityContract) return { ok: false, value: false };
    if (this.caller !== this.state.authorityContract) return { ok: false, value: false };
    if (newMax < this.state.minScore) return { ok: false, value: false };
    this.state.maxScore = newMax;
    return { ok: true, value: true };
  }

  setCreditFactor(factor: number): Result<boolean> {
    if (!this.state.authorityContract) return { ok: false, value: false };
    if (this.caller !== this.state.authorityContract) return { ok: false, value: false };
    if (factor <= 0) return { ok: false, value: false };
    this.state.creditFactor = factor;
    return { ok: true, value: true };
  }

  setPenaltyFactor(factor: number): Result<boolean> {
    if (!this.state.authorityContract) return { ok: false, value: false };
    if (this.caller !== this.state.authorityContract) return { ok: false, value: false };
    if (factor <= 0) return { ok: false, value: false };
    this.state.penaltyFactor = factor;
    return { ok: true, value: true };
  }

  createCreditProfile(
    did: string,
    initialScore: number,
    income: number,
    assetValue: number,
    age: number,
    employmentStatus: string,
    educationLevel: string,
    location: string,
    currency: string
  ): Result<number> {
    const user = this.caller;
    if (did.length === 0 || did.length > 128) return { ok: false, value: ERR_INVALID_DID };
    if (initialScore < this.state.minScore || initialScore > this.state.maxScore) return { ok: false, value: ERR_INVALID_SCORE };
    if (income < 0) return { ok: false, value: ERR_INVALID_INCOME };
    if (assetValue < 0) return { ok: false, value: ERR_INVALID_ASSET_VALUE };
    if (age < 18 || age > 120) return { ok: false, value: ERR_INVALID_AGE };
    if (!["employed", "self-employed", "unemployed"].includes(employmentStatus)) return { ok: false, value: ERR_INVALID_EMPLOYMENT_STATUS };
    if (!["high-school", "bachelor", "master", "phd"].includes(educationLevel)) return { ok: false, value: ERR_INVALID_EDUCATION_LEVEL };
    if (location.length === 0 || location.length > 100) return { ok: false, value: ERR_INVALID_LOCATION };
    if (!["STX", "USD", "BTC"].includes(currency)) return { ok: false, value: ERR_INVALID_CURRENCY };
    if (this.state.creditProfiles.has(user)) return { ok: false, value: ERR_PROFILE_ALREADY_EXISTS };

    const profile: CreditProfile = {
      did,
      creditScore: initialScore,
      loanCount: 0,
      totalRepaid: 0,
      totalBorrowed: 0,
      lastUpdated: this.blockHeight,
      income,
      assetValue,
      age,
      employmentStatus,
      educationLevel,
      location,
      currency,
      status: true,
    };
    this.state.creditProfiles.set(user, profile);
    this.state.historyCounters.set(user, 0);
    this.state.profileHistory.set(user, new Map());
    const id = this.state.profileCounter;
    this.state.profileCounter++;
    return { ok: true, value: id };
  }

  updateCreditScore(
    user: string,
    borrowedAmount: number,
    repaymentAmount: number,
    successful: boolean,
    reason: string
  ): Result<boolean> {
    const profile = this.state.creditProfiles.get(user);
    if (!profile) return { ok: false, value: false };
    if (this.caller !== user && this.caller !== this.state.oraclePrincipal) return { ok: false, value: false };
    if (repaymentAmount < 0) return { ok: false, value: false };
    if (reason.length === 0 || reason.length > 256) return { ok: false, value: false };
    const historyCount = this.state.historyCounters.get(user) || 0;
    if (historyCount >= this.state.maxHistoryEntries) return { ok: false, value: false };

    const scoreChange = successful ? this.state.creditFactor : -this.state.penaltyFactor;
    let newScore = profile.creditScore + scoreChange;
    if (newScore > this.state.maxScore) newScore = this.state.maxScore;
    if (newScore < this.state.minScore) newScore = this.state.minScore;

    const updatedProfile: CreditProfile = {
      ...profile,
      creditScore: newScore,
      loanCount: profile.loanCount + 1,
      totalRepaid: successful ? profile.totalRepaid + repaymentAmount : profile.totalRepaid,
      totalBorrowed: profile.totalBorrowed + borrowedAmount,
      lastUpdated: this.blockHeight,
    };
    this.state.creditProfiles.set(user, updatedProfile);

    const entry: HistoryEntry = {
      timestamp: this.blockHeight,
      scoreChange,
      reason,
      verifier: this.caller,
    };
    const history = this.state.profileHistory.get(user)!;
    history.set(historyCount, entry);
    this.state.historyCounters.set(user, historyCount + 1);

    return { ok: true, value: true };
  }

  addVerifiedData(
    user: string,
    income: number,
    assetValue: number,
    source: string
  ): Result<boolean> {
    const profile = this.state.creditProfiles.get(user);
    if (!profile) return { ok: false, value: false };
    if (this.caller !== this.state.oraclePrincipal) return { ok: false, value: false };
    if (income < 0) return { ok: false, value: false };
    if (assetValue < 0) return { ok: false, value: false };
    if (source.length === 0 || source.length > 128) return { ok: false, value: false };

    const updated: CreditProfile = {
      ...profile,
      income,
      assetValue,
      lastUpdated: this.blockHeight,
    };
    this.state.creditProfiles.set(user, updated);
    return { ok: true, value: true };
  }

  updatePersonalInfo(
    age: number,
    employmentStatus: string,
    educationLevel: string,
    location: string,
    currency: string
  ): Result<boolean> {
    const user = this.caller;
    const profile = this.state.creditProfiles.get(user);
    if (!profile) return { ok: false, value: false };
    if (age < 18 || age > 120) return { ok: false, value: false };
    if (!["employed", "self-employed", "unemployed"].includes(employmentStatus)) return { ok: false, value: false };
    if (!["high-school", "bachelor", "master", "phd"].includes(educationLevel)) return { ok: false, value: false };
    if (location.length === 0 || location.length > 100) return { ok: false, value: false };
    if (!["STX", "USD", "BTC"].includes(currency)) return { ok: false, value: false };

    const updated: CreditProfile = {
      ...profile,
      age,
      employmentStatus,
      educationLevel,
      location,
      currency,
      lastUpdated: this.blockHeight,
    };
    this.state.creditProfiles.set(user, updated);
    return { ok: true, value: true };
  }

  deactivateProfile(): Result<boolean> {
    const user = this.caller;
    const profile = this.state.creditProfiles.get(user);
    if (!profile) return { ok: false, value: false };

    const updated: CreditProfile = {
      ...profile,
      status: false,
      lastUpdated: this.blockHeight,
    };
    this.state.creditProfiles.set(user, updated);
    return { ok: true, value: true };
  }

  reactivateProfile(): Result<boolean> {
    const user = this.caller;
    const profile = this.state.creditProfiles.get(user);
    if (!profile) return { ok: false, value: false };
    if (profile.status) return { ok: false, value: false };

    const updated: CreditProfile = {
      ...profile,
      status: true,
      lastUpdated: this.blockHeight,
    };
    this.state.creditProfiles.set(user, updated);
    return { ok: true, value: true };
  }
}

describe("CreditProfileContract", () => {
  let contract: CreditProfileContractMock;

  beforeEach(() => {
    contract = new CreditProfileContractMock();
    contract.reset();
  });

  it("creates a credit profile successfully", () => {
    const result = contract.createCreditProfile(
      "did:example:123",
      500,
      100000,
      50000,
      30,
      "employed",
      "bachelor",
      "CityX",
      "USD"
    );
    expect(result.ok).toBe(true);
    expect(result.value).toBe(0);

    const profile = contract.getProfile("ST1TEST").value;
    expect(profile?.did).toBe("did:example:123");
    expect(profile?.creditScore).toBe(500);
    expect(profile?.income).toBe(100000);
    expect(profile?.assetValue).toBe(50000);
    expect(profile?.age).toBe(30);
    expect(profile?.employmentStatus).toBe("employed");
    expect(profile?.educationLevel).toBe("bachelor");
    expect(profile?.location).toBe("CityX");
    expect(profile?.currency).toBe("USD");
    expect(profile?.status).toBe(true);
  });

  it("rejects duplicate profile creation", () => {
    contract.createCreditProfile(
      "did:example:123",
      500,
      100000,
      50000,
      30,
      "employed",
      "bachelor",
      "CityX",
      "USD"
    );
    const result = contract.createCreditProfile(
      "did:example:456",
      600,
      200000,
      100000,
      40,
      "self-employed",
      "master",
      "CityY",
      "STX"
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_PROFILE_ALREADY_EXISTS);
  });

  it("updates credit score successfully", () => {
    contract.createCreditProfile(
      "did:example:123",
      500,
      100000,
      50000,
      30,
      "employed",
      "bachelor",
      "CityX",
      "USD"
    );
    const result = contract.updateCreditScore("ST1TEST", 1000, 1000, true, "Successful repayment");
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);

    const profile = contract.getProfile("ST1TEST").value;
    expect(profile?.creditScore).toBe(510);
    expect(profile?.loanCount).toBe(1);
    expect(profile?.totalRepaid).toBe(1000);
    expect(profile?.totalBorrowed).toBe(1000);

    const history = contract.getHistoryEntry("ST1TEST", 0).value;
    expect(history?.scoreChange).toBe(10);
    expect(history?.reason).toBe("Successful repayment");
  });

  it("applies penalty on failed repayment", () => {
    contract.createCreditProfile(
      "did:example:123",
      500,
      100000,
      50000,
      30,
      "employed",
      "bachelor",
      "CityX",
      "USD"
    );
    const result = contract.updateCreditScore("ST1TEST", 1000, 0, false, "Defaulted");
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);

    const profile = contract.getProfile("ST1TEST").value;
    expect(profile?.creditScore).toBe(480);
    expect(profile?.loanCount).toBe(1);
    expect(profile?.totalRepaid).toBe(0);
    expect(profile?.totalBorrowed).toBe(1000);
  });

  it("adds verified data successfully", () => {
    contract.setAuthorityContract("ST2AUTH");
    contract.caller = "ST2AUTH";
    contract.setOraclePrincipal("ST3ORACLE");
    contract.caller = "ST1TEST";
    contract.createCreditProfile(
      "did:example:123",
      500,
      100000,
      50000,
      30,
      "employed",
      "bachelor",
      "CityX",
      "USD"
    );
    contract.caller = "ST3ORACLE";
    const result = contract.addVerifiedData("ST1TEST", 150000, 75000, "OracleSource");
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);

    const profile = contract.getProfile("ST1TEST").value;
    expect(profile?.income).toBe(150000);
    expect(profile?.assetValue).toBe(75000);
  });

  it("updates personal info successfully", () => {
    contract.createCreditProfile(
      "did:example:123",
      500,
      100000,
      50000,
      30,
      "employed",
      "bachelor",
      "CityX",
      "USD"
    );
    const result = contract.updatePersonalInfo(35, "self-employed", "master", "CityY", "STX");
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);

    const profile = contract.getProfile("ST1TEST").value;
    expect(profile?.age).toBe(35);
    expect(profile?.employmentStatus).toBe("self-employed");
    expect(profile?.educationLevel).toBe("master");
    expect(profile?.location).toBe("CityY");
    expect(profile?.currency).toBe("STX");
  });

  it("deactivates and reactivates profile", () => {
    contract.createCreditProfile(
      "did:example:123",
      500,
      100000,
      50000,
      30,
      "employed",
      "bachelor",
      "CityX",
      "USD"
    );
    let result = contract.deactivateProfile();
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    let profile = contract.getProfile("ST1TEST").value;
    expect(profile?.status).toBe(false);

    result = contract.reactivateProfile();
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    profile = contract.getProfile("ST1TEST").value;
    expect(profile?.status).toBe(true);
  });

  it("rejects invalid DID in creation", () => {
    const result = contract.createCreditProfile(
      "",
      500,
      100000,
      50000,
      30,
      "employed",
      "bachelor",
      "CityX",
      "USD"
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_DID);
  });

  it("rejects score update without authorization", () => {
    contract.createCreditProfile(
      "did:example:123",
      500,
      100000,
      50000,
      30,
      "employed",
      "bachelor",
      "CityX",
      "USD"
    );
    contract.caller = "ST4UNAUTH";
    const result = contract.updateCreditScore("ST1TEST", 1000, 1000, true, "Test");
    expect(result.ok).toBe(false);
    expect(result.value).toBe(false);
  });

  it("sets min and max scores", () => {
    contract.setAuthorityContract("ST2AUTH");
    contract.caller = "ST2AUTH";
    let result = contract.setMinScore(100);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    expect(contract.getMinScore().value).toBe(100);

    result = contract.setMaxScore(900);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    expect(contract.getMaxScore().value).toBe(900);
  });

  it("parses Clarity values", () => {
    const didCV = stringAsciiCV("did:example:123");
    const scoreCV = uintCV(500);
    expect(didCV.value).toBe("did:example:123");
    expect(scoreCV.value).toEqual(BigInt(500));
  });
});
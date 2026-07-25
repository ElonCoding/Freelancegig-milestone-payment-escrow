#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env, String, Vec};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum MilestoneStatus {
    Pending,
    Submitted,
    Approved,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Milestone {
    pub description: String,
    pub amount: i128,
    pub status: MilestoneStatus,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Escrow {
    pub client: Address,
    pub freelancer: Address,
    pub token: Address,
    pub total: i128,
    pub released: i128,
    pub funded: bool,
    pub milestones: Vec<Milestone>,
}

#[contracttype]
pub enum DataKey {
    Escrow(u64),
    Count,
}

#[contract]
pub struct Contract;

#[contractimpl]
impl Contract {
    pub fn create_escrow(env: Env, client: Address, freelancer: Address, token: Address) -> u64 {
        client.require_auth();
        let id: u64 = env.storage().instance().get(&DataKey::Count).unwrap_or(0);
        env.storage().persistent().set(
            &DataKey::Escrow(id),
            &Escrow {
                client,
                freelancer,
                token,
                total: 0,
                released: 0,
                funded: false,
                milestones: Vec::new(&env),
            },
        );
        env.storage().instance().set(&DataKey::Count, &(id + 1));
        id
    }

    pub fn add_milestone(
        env: Env,
        caller: Address,
        escrow_id: u64,
        description: String,
        amount: i128,
    ) {
        caller.require_auth();
        assert!(amount > 0, "amount must be positive");
        let mut escrow: Escrow = env
            .storage()
            .persistent()
            .get(&DataKey::Escrow(escrow_id))
            .expect("escrow not found");
        assert!(escrow.client == caller, "only client can add milestones");
        assert!(!escrow.funded, "escrow already funded");
        escrow.total += amount;
        escrow.milestones.push_back(Milestone {
            description,
            amount,
            status: MilestoneStatus::Pending,
        });
        env.storage()
            .persistent()
            .set(&DataKey::Escrow(escrow_id), &escrow);
    }

    pub fn fund_escrow(env: Env, caller: Address, escrow_id: u64) {
        caller.require_auth();
        let mut escrow: Escrow = env
            .storage()
            .persistent()
            .get(&DataKey::Escrow(escrow_id))
            .expect("escrow not found");
        assert!(escrow.client == caller, "only client can fund");
        assert!(!escrow.funded, "already funded");
        assert!(escrow.total > 0, "no milestones to fund");
        token::Client::new(&env, &escrow.token).transfer(
            &caller,
            &env.current_contract_address(),
            &escrow.total,
        );
        escrow.funded = true;
        env.storage()
            .persistent()
            .set(&DataKey::Escrow(escrow_id), &escrow);
    }

    pub fn submit_milestone(env: Env, caller: Address, escrow_id: u64, milestone_index: u32) {
        caller.require_auth();
        let mut escrow: Escrow = env
            .storage()
            .persistent()
            .get(&DataKey::Escrow(escrow_id))
            .expect("escrow not found");
        assert!(escrow.freelancer == caller, "only freelancer can submit");
        assert!(escrow.funded, "escrow not funded");
        let mut ms = escrow
            .milestones
            .get(milestone_index)
            .expect("milestone not found");
        assert!(
            ms.status == MilestoneStatus::Pending,
            "milestone already processed"
        );
        ms.status = MilestoneStatus::Submitted;
        escrow.milestones.set(milestone_index, ms);
        env.storage()
            .persistent()
            .set(&DataKey::Escrow(escrow_id), &escrow);
    }

    pub fn approve_milestone(env: Env, caller: Address, escrow_id: u64, milestone_index: u32) {
        caller.require_auth();
        let mut escrow: Escrow = env
            .storage()
            .persistent()
            .get(&DataKey::Escrow(escrow_id))
            .expect("escrow not found");
        assert!(escrow.client == caller, "only client can approve");
        let mut ms = escrow
            .milestones
            .get(milestone_index)
            .expect("milestone not found");
        assert!(
            ms.status == MilestoneStatus::Submitted,
            "milestone not submitted"
        );
        token::Client::new(&env, &escrow.token).transfer(
            &env.current_contract_address(),
            &escrow.freelancer,
            &ms.amount,
        );
        escrow.released += ms.amount;
        ms.status = MilestoneStatus::Approved;
        escrow.milestones.set(milestone_index, ms);
        env.storage()
            .persistent()
            .set(&DataKey::Escrow(escrow_id), &escrow);
    }

    pub fn cancel_escrow(env: Env, caller: Address, escrow_id: u64) {
        caller.require_auth();
        let mut escrow: Escrow = env
            .storage()
            .persistent()
            .get(&DataKey::Escrow(escrow_id))
            .expect("escrow not found");
        assert!(escrow.client == caller, "only client can cancel");
        assert!(escrow.funded, "escrow not funded");
        let mut i = 0u32;
        while i < escrow.milestones.len() {
            let ms = escrow.milestones.get(i).unwrap();
            assert!(
                ms.status == MilestoneStatus::Pending,
                "cannot cancel: milestones in progress"
            );
            i += 1;
        }
        let refund = escrow.total - escrow.released;
        if refund > 0 {
            token::Client::new(&env, &escrow.token).transfer(
                &env.current_contract_address(),
                &escrow.client,
                &refund,
            );
        }
        escrow.released = escrow.total;
        env.storage()
            .persistent()
            .set(&DataKey::Escrow(escrow_id), &escrow);
    }

    pub fn get_escrow(env: Env, escrow_id: u64) -> Escrow {
        env.storage()
            .persistent()
            .get(&DataKey::Escrow(escrow_id))
            .expect("escrow not found")
    }

    pub fn get_milestone_count(env: Env, escrow_id: u64) -> u32 {
        let escrow: Escrow = env
            .storage()
            .persistent()
            .get(&DataKey::Escrow(escrow_id))
            .expect("escrow not found");
        escrow.milestones.len()
    }

    pub fn get_milestone(env: Env, escrow_id: u64, milestone_index: u32) -> Milestone {
        let escrow: Escrow = env
            .storage()
            .persistent()
            .get(&DataKey::Escrow(escrow_id))
            .expect("escrow not found");
        escrow
            .milestones
            .get(milestone_index)
            .expect("milestone not found")
    }
}

mod test;

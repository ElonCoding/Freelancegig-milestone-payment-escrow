#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, token, Address, Env, String, Vec,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum EscrowError {
    Unauthorized = 1,
    InvalidAmount = 2,
    EscrowNotFound = 3,
    AlreadyFunded = 4,
    NotFunded = 5,
    MilestoneNotFound = 6,
    InvalidMilestoneStatus = 7,
    DisputePending = 8,
    MilestonesInProgress = 9,
    NoMilestonesToFund = 10,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum MilestoneStatus {
    Pending,
    Submitted,
    Approved,
    Disputed,
    Refunded,
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
pub struct Dispute {
    pub dispute_id: u64,
    pub milestone_index: u32,
    pub raiser: Address,
    pub reason: String,
    pub resolved: bool,
    pub fav_freelancer: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Escrow {
    pub client: Address,
    pub freelancer: Address,
    pub arbitrator: Address,
    pub token: Address,
    pub total: i128,
    pub released: i128,
    pub funded: bool,
    pub milestones: Vec<Milestone>,
    pub disputes: Vec<Dispute>,
}

#[contracttype]
pub enum DataKey {
    Escrow(u64),
    Count,
}

pub trait EscrowTrait {
    fn create_escrow(
        env: Env,
        client: Address,
        freelancer: Address,
        arbitrator: Address,
        token: Address,
    ) -> u64;

    fn add_milestone(
        env: Env,
        caller: Address,
        escrow_id: u64,
        description: String,
        amount: i128,
    ) -> Result<(), EscrowError>;

    fn fund_escrow(env: Env, caller: Address, escrow_id: u64) -> Result<(), EscrowError>;

    fn submit_milestone(
        env: Env,
        caller: Address,
        escrow_id: u64,
        milestone_index: u32,
    ) -> Result<(), EscrowError>;

    fn approve_milestone(
        env: Env,
        caller: Address,
        escrow_id: u64,
        milestone_index: u32,
    ) -> Result<(), EscrowError>;

    fn raise_dispute(
        env: Env,
        caller: Address,
        escrow_id: u64,
        milestone_index: u32,
        reason: String,
    ) -> Result<u64, EscrowError>;

    fn resolve_dispute(
        env: Env,
        caller: Address,
        escrow_id: u64,
        dispute_id: u64,
        fav_freelancer: bool,
    ) -> Result<(), EscrowError>;

    fn cancel_escrow(env: Env, caller: Address, escrow_id: u64) -> Result<(), EscrowError>;

    fn get_escrow(env: Env, escrow_id: u64) -> Result<Escrow, EscrowError>;

    fn get_milestone_count(env: Env, escrow_id: u64) -> Result<u32, EscrowError>;

    fn get_milestone(env: Env, escrow_id: u64, milestone_index: u32) -> Result<Milestone, EscrowError>;
}

#[contract]
pub struct EscrowContract;

#[contractimpl]
impl EscrowTrait for EscrowContract {
    /// Creates a new milestone-based escrow project specifying client, freelancer, arbitrator, and payment token.
    fn create_escrow(
        env: Env,
        client: Address,
        freelancer: Address,
        arbitrator: Address,
        token: Address,
    ) -> u64 {
        client.require_auth();
        let id: u64 = env.storage().instance().get(&DataKey::Count).unwrap_or(0);
        let escrow = Escrow {
            client: client.clone(),
            freelancer: freelancer.clone(),
            arbitrator,
            token,
            total: 0,
            released: 0,
            funded: false,
            milestones: Vec::new(&env),
            disputes: Vec::new(&env),
        };
        env.storage().persistent().set(&DataKey::Escrow(id), &escrow);
        env.storage().instance().set(&DataKey::Count, &(id + 1));

        env.events().publish(
            (symbol_short!("escrow"), symbol_short!("create")),
            (id, client, freelancer),
        );

        id
    }

    /// Adds a milestone definition to an unfunded escrow project.
    fn add_milestone(
        env: Env,
        caller: Address,
        escrow_id: u64,
        description: String,
        amount: i128,
    ) -> Result<(), EscrowError> {
        caller.require_auth();
        if amount <= 0 {
            return Err(EscrowError::InvalidAmount);
        }
        let mut escrow: Escrow = env
            .storage()
            .persistent()
            .get(&DataKey::Escrow(escrow_id))
            .ok_or(EscrowError::EscrowNotFound)?;

        if escrow.client != caller {
            return Err(EscrowError::Unauthorized);
        }
        if escrow.funded {
            return Err(EscrowError::AlreadyFunded);
        }

        escrow.total += amount;
        escrow.milestones.push_back(Milestone {
            description,
            amount,
            status: MilestoneStatus::Pending,
        });

        env.storage().persistent().set(&DataKey::Escrow(escrow_id), &escrow);
        Ok(())
    }

    /// Locks client payment tokens into the escrow contract for all defined milestones.
    fn fund_escrow(env: Env, caller: Address, escrow_id: u64) -> Result<(), EscrowError> {
        caller.require_auth();
        let mut escrow: Escrow = env
            .storage()
            .persistent()
            .get(&DataKey::Escrow(escrow_id))
            .ok_or(EscrowError::EscrowNotFound)?;

        if escrow.client != caller {
            return Err(EscrowError::Unauthorized);
        }
        if escrow.funded {
            return Err(EscrowError::AlreadyFunded);
        }
        if escrow.total <= 0 {
            return Err(EscrowError::NoMilestonesToFund);
        }

        token::Client::new(&env, &escrow.token).transfer(
            &caller,
            &env.current_contract_address(),
            &escrow.total,
        );

        escrow.funded = true;
        env.storage().persistent().set(&DataKey::Escrow(escrow_id), &escrow);

        env.events().publish(
            (symbol_short!("escrow"), symbol_short!("fund")),
            (escrow_id, caller, escrow.total),
        );

        Ok(())
    }

    /// Freelancer submits work for approval on a pending milestone.
    fn submit_milestone(
        env: Env,
        caller: Address,
        escrow_id: u64,
        milestone_index: u32,
    ) -> Result<(), EscrowError> {
        caller.require_auth();
        let mut escrow: Escrow = env
            .storage()
            .persistent()
            .get(&DataKey::Escrow(escrow_id))
            .ok_or(EscrowError::EscrowNotFound)?;

        if escrow.freelancer != caller {
            return Err(EscrowError::Unauthorized);
        }
        if !escrow.funded {
            return Err(EscrowError::NotFunded);
        }

        let mut ms = escrow
            .milestones
            .get(milestone_index)
            .ok_or(EscrowError::MilestoneNotFound)?;

        if ms.status != MilestoneStatus::Pending {
            return Err(EscrowError::InvalidMilestoneStatus);
        }

        ms.status = MilestoneStatus::Submitted;
        escrow.milestones.set(milestone_index, ms);
        env.storage().persistent().set(&DataKey::Escrow(escrow_id), &escrow);

        env.events().publish(
            (symbol_short!("work"), symbol_short!("submit")),
            (escrow_id, milestone_index, caller),
        );

        Ok(())
    }

    /// Client approves submitted milestone work and releases funds to freelancer.
    fn approve_milestone(
        env: Env,
        caller: Address,
        escrow_id: u64,
        milestone_index: u32,
    ) -> Result<(), EscrowError> {
        caller.require_auth();
        let mut escrow: Escrow = env
            .storage()
            .persistent()
            .get(&DataKey::Escrow(escrow_id))
            .ok_or(EscrowError::EscrowNotFound)?;

        if escrow.client != caller {
            return Err(EscrowError::Unauthorized);
        }

        let mut ms = escrow
            .milestones
            .get(milestone_index)
            .ok_or(EscrowError::MilestoneNotFound)?;

        if ms.status != MilestoneStatus::Submitted {
            return Err(EscrowError::InvalidMilestoneStatus);
        }

        token::Client::new(&env, &escrow.token).transfer(
            &env.current_contract_address(),
            &escrow.freelancer,
            &ms.amount,
        );

        escrow.released += ms.amount;
        ms.status = MilestoneStatus::Approved;
        escrow.milestones.set(milestone_index, ms);
        env.storage().persistent().set(&DataKey::Escrow(escrow_id), &escrow);

        env.events().publish(
            (symbol_short!("work"), symbol_short!("approve")),
            (escrow_id, milestone_index, ms.amount),
        );
        env.events().publish(
            (symbol_short!("funds"), symbol_short!("release")),
            (escrow_id, milestone_index, escrow.freelancer.clone(), ms.amount),
        );

        Ok(())
    }

    /// Raises a dispute on a pending or submitted milestone.
    fn raise_dispute(
        env: Env,
        caller: Address,
        escrow_id: u64,
        milestone_index: u32,
        reason: String,
    ) -> Result<u64, EscrowError> {
        caller.require_auth();
        let mut escrow: Escrow = env
            .storage()
            .persistent()
            .get(&DataKey::Escrow(escrow_id))
            .ok_or(EscrowError::EscrowNotFound)?;

        if caller != escrow.client && caller != escrow.freelancer {
            return Err(EscrowError::Unauthorized);
        }

        let mut ms = escrow
            .milestones
            .get(milestone_index)
            .ok_or(EscrowError::MilestoneNotFound)?;

        if ms.status != MilestoneStatus::Submitted && ms.status != MilestoneStatus::Pending {
            return Err(EscrowError::InvalidMilestoneStatus);
        }

        ms.status = MilestoneStatus::Disputed;
        escrow.milestones.set(milestone_index, ms);

        let dispute_id = escrow.disputes.len() as u64;
        escrow.disputes.push_back(Dispute {
            dispute_id,
            milestone_index,
            raiser: caller.clone(),
            reason,
            resolved: false,
            fav_freelancer: false,
        });

        env.storage().persistent().set(&DataKey::Escrow(escrow_id), &escrow);

        env.events().publish(
            (symbol_short!("dispute"), symbol_short!("raise")),
            (escrow_id, milestone_index, caller),
        );

        Ok(dispute_id)
    }

    /// Arbitrator resolves a raised dispute, releasing milestone funds to freelancer or refunding client.
    fn resolve_dispute(
        env: Env,
        caller: Address,
        escrow_id: u64,
        dispute_id: u64,
        fav_freelancer: bool,
    ) -> Result<(), EscrowError> {
        caller.require_auth();
        let mut escrow: Escrow = env
            .storage()
            .persistent()
            .get(&DataKey::Escrow(escrow_id))
            .ok_or(EscrowError::EscrowNotFound)?;

        if caller != escrow.arbitrator {
            return Err(EscrowError::Unauthorized);
        }

        let mut dispute = escrow
            .disputes
            .get(dispute_id as u32)
            .ok_or(EscrowError::MilestoneNotFound)?;

        if dispute.resolved {
            return Err(EscrowError::InvalidMilestoneStatus);
        }

        let milestone_index = dispute.milestone_index;
        let mut ms = escrow
            .milestones
            .get(milestone_index)
            .ok_or(EscrowError::MilestoneNotFound)?;

        if ms.status != MilestoneStatus::Disputed {
            return Err(EscrowError::InvalidMilestoneStatus);
        }

        if fav_freelancer {
            token::Client::new(&env, &escrow.token).transfer(
                &env.current_contract_address(),
                &escrow.freelancer,
                &ms.amount,
            );
            escrow.released += ms.amount;
            ms.status = MilestoneStatus::Approved;
        } else {
            token::Client::new(&env, &escrow.token).transfer(
                &env.current_contract_address(),
                &escrow.client,
                &ms.amount,
            );
            ms.status = MilestoneStatus::Refunded;
        }

        dispute.resolved = true;
        dispute.fav_freelancer = fav_freelancer;

        escrow.disputes.set(dispute_id as u32, dispute);
        escrow.milestones.set(milestone_index, ms);
        env.storage().persistent().set(&DataKey::Escrow(escrow_id), &escrow);

        env.events().publish(
            (symbol_short!("dispute"), symbol_short!("resolve")),
            (escrow_id, milestone_index, fav_freelancer),
        );

        Ok(())
    }

    /// Cancels funded escrow project and refunds unreleased funds to client.
    fn cancel_escrow(env: Env, caller: Address, escrow_id: u64) -> Result<(), EscrowError> {
        caller.require_auth();
        let mut escrow: Escrow = env
            .storage()
            .persistent()
            .get(&DataKey::Escrow(escrow_id))
            .ok_or(EscrowError::EscrowNotFound)?;

        if escrow.client != caller {
            return Err(EscrowError::Unauthorized);
        }
        if !escrow.funded {
            return Err(EscrowError::NotFunded);
        }

        let mut i = 0u32;
        while i < escrow.milestones.len() {
            let ms = escrow.milestones.get(i).unwrap();
            if ms.status == MilestoneStatus::Submitted || ms.status == MilestoneStatus::Disputed {
                return Err(EscrowError::MilestonesInProgress);
            }
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
        env.storage().persistent().set(&DataKey::Escrow(escrow_id), &escrow);

        Ok(())
    }

    /// Returns full escrow record by ID.
    fn get_escrow(env: Env, escrow_id: u64) -> Result<Escrow, EscrowError> {
        env.storage()
            .persistent()
            .get(&DataKey::Escrow(escrow_id))
            .ok_or(EscrowError::EscrowNotFound)
    }

    /// Returns total milestone count for an escrow.
    fn get_milestone_count(env: Env, escrow_id: u64) -> Result<u32, EscrowError> {
        let escrow = Self::get_escrow(env, escrow_id)?;
        Ok(escrow.milestones.len())
    }

    /// Returns milestone details by index.
    fn get_milestone(env: Env, escrow_id: u64, milestone_index: u32) -> Result<Milestone, EscrowError> {
        let escrow = Self::get_escrow(env, escrow_id)?;
        escrow
            .milestones
            .get(milestone_index)
            .ok_or(EscrowError::MilestoneNotFound)
    }
}

mod test;

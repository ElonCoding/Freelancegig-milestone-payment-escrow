#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

#[test]
fn test_create_escrow() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let client_addr = Address::generate(&env);
    let freelancer = Address::generate(&env);
    let token = env.register_stellar_asset_contract(admin);

    let contract_id = env.register(Contract, ());
    let c = ContractClient::new(&env, &contract_id);

    let id = c.create_escrow(&client_addr, &freelancer, &token);
    assert_eq!(id, 0);

    let escrow = c.get_escrow(&id);
    assert_eq!(escrow.client, client_addr);
    assert_eq!(escrow.freelancer, freelancer);
    assert_eq!(escrow.token, token);
    assert_eq!(escrow.total, 0);
    assert_eq!(escrow.released, 0);
    assert!(!escrow.funded);
    assert_eq!(escrow.milestones.len(), 0);
}

#[test]
fn test_add_milestones() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let client_addr = Address::generate(&env);
    let freelancer = Address::generate(&env);
    let token = env.register_stellar_asset_contract(admin);

    let contract_id = env.register(Contract, ());
    let c = ContractClient::new(&env, &contract_id);

    let id = c.create_escrow(&client_addr, &freelancer, &token);
    c.add_milestone(&client_addr, &id, &String::from_str(&env, "Design"), &1000);
    c.add_milestone(&client_addr, &id, &String::from_str(&env, "Development"), &2000);

    assert_eq!(c.get_milestone_count(&id), 2);
    let escrow = c.get_escrow(&id);
    assert_eq!(escrow.total, 3000);

    let ms0 = c.get_milestone(&id, &0);
    assert_eq!(ms0.description, String::from_str(&env, "Design"));
    assert_eq!(ms0.amount, 1000);
    assert_eq!(ms0.status, MilestoneStatus::Pending);

    let ms1 = c.get_milestone(&id, &1);
    assert_eq!(ms1.description, String::from_str(&env, "Development"));
    assert_eq!(ms1.amount, 2000);
}

#[test]
fn test_full_lifecycle() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let client_addr = Address::generate(&env);
    let freelancer = Address::generate(&env);
    let token = env.register_stellar_asset_contract(admin);

    let contract_id = env.register(Contract, ());
    let c = ContractClient::new(&env, &contract_id);

    let token_admin = soroban_sdk::token::StellarAssetClient::new(&env, &token);
    token_admin.mint(&client_addr, &5000);

    let id = c.create_escrow(&client_addr, &freelancer, &token);
    c.add_milestone(&client_addr, &id, &String::from_str(&env, "Design"), &1000);
    c.add_milestone(&client_addr, &id, &String::from_str(&env, "Dev"), &2000);

    c.fund_escrow(&client_addr, &id);
    let escrow = c.get_escrow(&id);
    assert!(escrow.funded);
    assert_eq!(escrow.total, 3000);

    // Submit & approve first milestone
    c.submit_milestone(&freelancer, &id, &0);
    let ms = c.get_milestone(&id, &0);
    assert_eq!(ms.status, MilestoneStatus::Submitted);

    c.approve_milestone(&client_addr, &id, &0);
    let escrow = c.get_escrow(&id);
    assert_eq!(escrow.released, 1000);

    // Submit & approve second milestone
    c.submit_milestone(&freelancer, &id, &1);
    c.approve_milestone(&client_addr, &id, &1);
    let escrow = c.get_escrow(&id);
    assert_eq!(escrow.released, 3000);

    // Freelancer received all funds
    let bal = token_admin.balance(&freelancer);
    assert_eq!(bal, 3000);
}

#[test]
fn test_cancel_escrow() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let client_addr = Address::generate(&env);
    let freelancer = Address::generate(&env);
    let token = env.register_stellar_asset_contract(admin);

    let contract_id = env.register(Contract, ());
    let c = ContractClient::new(&env, &contract_id);

    let token_admin = soroban_sdk::token::StellarAssetClient::new(&env, &token);
    token_admin.mint(&client_addr, &5000);

    let id = c.create_escrow(&client_addr, &freelancer, &token);
    c.add_milestone(&client_addr, &id, &String::from_str(&env, "Design"), &1000);
    c.add_milestone(&client_addr, &id, &String::from_str(&env, "Dev"), &2000);
    c.fund_escrow(&client_addr, &id);

    // Cancel before any submissions
    c.cancel_escrow(&client_addr, &id);

    // Client gets full refund
    let bal = token_admin.balance(&client_addr);
    assert_eq!(bal, 5000);
}

#[test]
#[should_panic(expected = "escrow already funded")]
fn test_cannot_add_after_funding() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let client_addr = Address::generate(&env);
    let freelancer = Address::generate(&env);
    let token = env.register_stellar_asset_contract(admin);

    let contract_id = env.register(Contract, ());
    let c = ContractClient::new(&env, &contract_id);

    let token_admin = soroban_sdk::token::StellarAssetClient::new(&env, &token);
    token_admin.mint(&client_addr, &5000);

    let id = c.create_escrow(&client_addr, &freelancer, &token);
    c.add_milestone(&client_addr, &id, &String::from_str(&env, "Design"), &1000);
    c.fund_escrow(&client_addr, &id);

    // Should panic — escrow already funded
    c.add_milestone(&client_addr, &id, &String::from_str(&env, "Late"), &500);
}

#[test]
#[should_panic(expected = "only client can add milestones")]
fn test_only_client_can_add() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let client_addr = Address::generate(&env);
    let freelancer = Address::generate(&env);
    let token = env.register_stellar_asset_contract(admin);

    let contract_id = env.register(Contract, ());
    let c = ContractClient::new(&env, &contract_id);

    let id = c.create_escrow(&client_addr, &freelancer, &token);
    c.add_milestone(&freelancer, &id, &String::from_str(&env, "Design"), &1000);
}

#[test]
#[should_panic(expected = "only freelancer can submit")]
fn test_only_freelancer_can_submit() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let client_addr = Address::generate(&env);
    let freelancer = Address::generate(&env);
    let token = env.register_stellar_asset_contract(admin);

    let contract_id = env.register(Contract, ());
    let c = ContractClient::new(&env, &contract_id);

    let token_admin = soroban_sdk::token::StellarAssetClient::new(&env, &token);
    token_admin.mint(&client_addr, &5000);

    let id = c.create_escrow(&client_addr, &freelancer, &token);
    c.add_milestone(&client_addr, &id, &String::from_str(&env, "Design"), &1000);
    c.fund_escrow(&client_addr, &id);

    // Client tries to submit — should fail
    c.submit_milestone(&client_addr, &id, &0);
}

#[test]
#[should_panic(expected = "only client can approve")]
fn test_only_client_can_approve() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let client_addr = Address::generate(&env);
    let freelancer = Address::generate(&env);
    let token = env.register_stellar_asset_contract(admin);

    let contract_id = env.register(Contract, ());
    let c = ContractClient::new(&env, &contract_id);

    let token_admin = soroban_sdk::token::StellarAssetClient::new(&env, &token);
    token_admin.mint(&client_addr, &5000);

    let id = c.create_escrow(&client_addr, &freelancer, &token);
    c.add_milestone(&client_addr, &id, &String::from_str(&env, "Design"), &1000);
    c.fund_escrow(&client_addr, &id);
    c.submit_milestone(&freelancer, &id, &0);

    // Freelancer tries to approve — should fail
    c.approve_milestone(&freelancer, &id, &0);
}

#[test]
#[should_panic(expected = "milestone not submitted")]
fn test_cannot_approve_unsubmitted() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let client_addr = Address::generate(&env);
    let freelancer = Address::generate(&env);
    let token = env.register_stellar_asset_contract(admin);

    let contract_id = env.register(Contract, ());
    let c = ContractClient::new(&env, &contract_id);

    let token_admin = soroban_sdk::token::StellarAssetClient::new(&env, &token);
    token_admin.mint(&client_addr, &5000);

    let id = c.create_escrow(&client_addr, &freelancer, &token);
    c.add_milestone(&client_addr, &id, &String::from_str(&env, "Design"), &1000);
    c.fund_escrow(&client_addr, &id);

    // Approve without submit — should fail
    c.approve_milestone(&client_addr, &id, &0);
}

#[test]
#[should_panic(expected = "milestone already processed")]
fn test_cannot_submit_twice() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let client_addr = Address::generate(&env);
    let freelancer = Address::generate(&env);
    let token = env.register_stellar_asset_contract(admin);

    let contract_id = env.register(Contract, ());
    let c = ContractClient::new(&env, &contract_id);

    let token_admin = soroban_sdk::token::StellarAssetClient::new(&env, &token);
    token_admin.mint(&client_addr, &5000);

    let id = c.create_escrow(&client_addr, &freelancer, &token);
    c.add_milestone(&client_addr, &id, &String::from_str(&env, "Design"), &1000);
    c.fund_escrow(&client_addr, &id);

    c.submit_milestone(&freelancer, &id, &0);
    // Submit again — should fail
    c.submit_milestone(&freelancer, &id, &0);
}

#[test]
#[should_panic(expected = "cannot cancel: milestones in progress")]
fn test_cannot_cancel_with_submissions() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let client_addr = Address::generate(&env);
    let freelancer = Address::generate(&env);
    let token = env.register_stellar_asset_contract(admin);

    let contract_id = env.register(Contract, ());
    let c = ContractClient::new(&env, &contract_id);

    let token_admin = soroban_sdk::token::StellarAssetClient::new(&env, &token);
    token_admin.mint(&client_addr, &5000);

    let id = c.create_escrow(&client_addr, &freelancer, &token);
    c.add_milestone(&client_addr, &id, &String::from_str(&env, "Design"), &1000);
    c.fund_escrow(&client_addr, &id);
    c.submit_milestone(&freelancer, &id, &0);

    // Cancel after submission — should fail
    c.cancel_escrow(&client_addr, &id);
}

#[test]
fn test_multiple_escrows() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let client_addr = Address::generate(&env);
    let freelancer = Address::generate(&env);
    let token = env.register_stellar_asset_contract(admin);

    let contract_id = env.register(Contract, ());
    let c = ContractClient::new(&env, &contract_id);

    let id1 = c.create_escrow(&client_addr, &freelancer, &token);
    let id2 = c.create_escrow(&client_addr, &freelancer, &token);

    assert_eq!(id1, 0);
    assert_eq!(id2, 1);
    assert_ne!(id1, id2);
}

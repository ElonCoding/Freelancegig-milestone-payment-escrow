#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::Address as _,
    token::{StellarAssetClient as TokenAdminClient, Client as TokenClient},
    Address, Env, String,
};

fn create_token_contract<'a>(env: &Env, admin: &Address) -> (TokenClient<'a>, TokenAdminClient<'a>) {
    let token_address = env.register_stellar_asset_contract_v2(admin.clone()).address();
    (
        TokenClient::new(env, &token_address),
        TokenAdminClient::new(env, &token_address),
    )
}

fn setup_test<'a>() -> (
    Env,
    Address,
    Address,
    Address,
    TokenClient<'a>,
    TokenAdminClient<'a>,
    Address,
) {
    let env = Env::default();
    env.mock_all_auths();

    let client = Address::generate(&env);
    let freelancer = Address::generate(&env);
    let arbitrator = Address::generate(&env);

    let (token, token_admin) = create_token_contract(&env, &client);
    let escrow_contract_id = env.register(EscrowContract, ());

    token_admin.mint(&client, &10_000_000);

    (
        env,
        client,
        freelancer,
        arbitrator,
        token,
        token_admin,
        escrow_contract_id,
    )
}

#[test]
fn test_create_and_fund_project() {
    let (env, client, freelancer, arbitrator, token, _admin, escrow_id_addr) = setup_test();
    let escrow_client = EscrowContractClient::new(&env, &escrow_id_addr);

    let id = escrow_client.create_escrow(&client, &freelancer, &arbitrator, &token.address);
    assert_eq!(id, 0);

    escrow_client.add_milestone(
        &client,
        &id,
        &String::from_str(&env, "Milestone 1"),
        &1_000,
    );

    let escrow = escrow_client.get_escrow(&id);
    assert_eq!(escrow.total, 1_000);
    assert_eq!(escrow.funded, false);

    escrow_client.fund_escrow(&client, &id);

    let escrow_after = escrow_client.get_escrow(&id);
    assert_eq!(escrow_after.funded, true);
    assert_eq!(token.balance(&escrow_id_addr), 1_000);
}

#[test]
fn test_submit_work_and_approve() {
    let (env, client, freelancer, arbitrator, token, _admin, escrow_id_addr) = setup_test();
    let escrow_client = EscrowContractClient::new(&env, &escrow_id_addr);

    let id = escrow_client.create_escrow(&client, &freelancer, &arbitrator, &token.address);
    escrow_client.add_milestone(&client, &id, &String::from_str(&env, "Milestone 1"), &2_000);
    escrow_client.fund_escrow(&client, &id);

    escrow_client.submit_milestone(&freelancer, &id, &0);
    let ms = escrow_client.get_milestone(&id, &0);
    assert_eq!(ms.status, MilestoneStatus::Submitted);

    let initial_balance = token.balance(&freelancer);
    escrow_client.approve_milestone(&client, &id, &0);

    assert_eq!(token.balance(&freelancer), initial_balance + 2_000);
    let ms_after = escrow_client.get_milestone(&id, &0);
    assert_eq!(ms_after.status, MilestoneStatus::Approved);
}

#[test]
fn test_release_funds() {
    let (env, client, freelancer, arbitrator, token, _admin, escrow_id_addr) = setup_test();
    let escrow_client = EscrowContractClient::new(&env, &escrow_id_addr);

    let id = escrow_client.create_escrow(&client, &freelancer, &arbitrator, &token.address);
    escrow_client.add_milestone(&client, &id, &String::from_str(&env, "MS 1"), &1_500);
    escrow_client.fund_escrow(&client, &id);

    escrow_client.submit_milestone(&freelancer, &id, &0);
    escrow_client.approve_milestone(&client, &id, &0);

    let escrow = escrow_client.get_escrow(&id);
    assert_eq!(escrow.released, 1_500);
}

#[test]
fn test_dispute_flow_freelancer_wins() {
    let (env, client, freelancer, arbitrator, token, _admin, escrow_id_addr) = setup_test();
    let escrow_client = EscrowContractClient::new(&env, &escrow_id_addr);

    let id = escrow_client.create_escrow(&client, &freelancer, &arbitrator, &token.address);
    escrow_client.add_milestone(&client, &id, &String::from_str(&env, "MS 1"), &3_000);
    escrow_client.fund_escrow(&client, &id);
    escrow_client.submit_milestone(&freelancer, &id, &0);

    let dispute_id = escrow_client.raise_dispute(
        &freelancer,
        &id,
        &0,
        &String::from_str(&env, "Client non responsive"),
    );

    assert_eq!(dispute_id, 0);
    let ms = escrow_client.get_milestone(&id, &0);
    assert_eq!(ms.status, MilestoneStatus::Disputed);

    escrow_client.resolve_dispute(&arbitrator, &id, &dispute_id, &true);

    assert_eq!(token.balance(&freelancer), 3_000);
    let ms_after = escrow_client.get_milestone(&id, &0);
    assert_eq!(ms_after.status, MilestoneStatus::Approved);
}

#[test]
fn test_dispute_flow_client_wins() {
    let (env, client, freelancer, arbitrator, token, _admin, escrow_id_addr) = setup_test();
    let escrow_client = EscrowContractClient::new(&env, &escrow_id_addr);

    let id = escrow_client.create_escrow(&client, &freelancer, &arbitrator, &token.address);
    escrow_client.add_milestone(&client, &id, &String::from_str(&env, "MS 1"), &2_500);
    escrow_client.fund_escrow(&client, &id);
    escrow_client.submit_milestone(&freelancer, &id, &0);

    let dispute_id = escrow_client.raise_dispute(
        &client,
        &id,
        &0,
        &String::from_str(&env, "Incomplete work"),
    );

    let initial_client_bal = token.balance(&client);
    escrow_client.resolve_dispute(&arbitrator, &id, &dispute_id, &false);

    assert_eq!(token.balance(&client), initial_client_bal + 2_500);
    let ms_after = escrow_client.get_milestone(&id, &0);
    assert_eq!(ms_after.status, MilestoneStatus::Refunded);
}

#[test]
fn test_access_control_unauthorized_approve() {
    let (env, client, freelancer, arbitrator, token, _admin, escrow_id_addr) = setup_test();
    let escrow_client = EscrowContractClient::new(&env, &escrow_id_addr);
    let unauthorized = Address::generate(&env);

    let id = escrow_client.create_escrow(&client, &freelancer, &arbitrator, &token.address);
    escrow_client.add_milestone(&client, &id, &String::from_str(&env, "MS 1"), &1_000);
    escrow_client.fund_escrow(&client, &id);
    escrow_client.submit_milestone(&freelancer, &id, &0);

    let res = escrow_client.try_approve_milestone(&unauthorized, &id, &0);
    assert_eq!(res, Err(Ok(EscrowError::Unauthorized)));
}

#[test]
fn test_access_control_unauthorized_submit() {
    let (env, client, freelancer, arbitrator, token, _admin, escrow_id_addr) = setup_test();
    let escrow_client = EscrowContractClient::new(&env, &escrow_id_addr);
    let unauthorized = Address::generate(&env);

    let id = escrow_client.create_escrow(&client, &freelancer, &arbitrator, &token.address);
    escrow_client.add_milestone(&client, &id, &String::from_str(&env, "MS 1"), &1_000);
    escrow_client.fund_escrow(&client, &id);

    let res = escrow_client.try_submit_milestone(&unauthorized, &id, &0);
    assert_eq!(res, Err(Ok(EscrowError::Unauthorized)));
}

#[test]
fn test_access_control_unauthorized_dispute_resolve() {
    let (env, client, freelancer, arbitrator, token, _admin, escrow_id_addr) = setup_test();
    let escrow_client = EscrowContractClient::new(&env, &escrow_id_addr);
    let fake_arbitrator = Address::generate(&env);

    let id = escrow_client.create_escrow(&client, &freelancer, &arbitrator, &token.address);
    escrow_client.add_milestone(&client, &id, &String::from_str(&env, "MS 1"), &1_000);
    escrow_client.fund_escrow(&client, &id);
    escrow_client.submit_milestone(&freelancer, &id, &0);
    let dispute_id = escrow_client.raise_dispute(&client, &id, &0, &String::from_str(&env, "issue"));

    let res = escrow_client.try_resolve_dispute(&fake_arbitrator, &id, &dispute_id, &true);
    assert_eq!(res, Err(Ok(EscrowError::Unauthorized)));
}

#[test]
fn test_zero_amount_milestone_fails() {
    let (env, client, freelancer, arbitrator, token, _admin, escrow_id_addr) = setup_test();
    let escrow_client = EscrowContractClient::new(&env, &escrow_id_addr);

    let id = escrow_client.create_escrow(&client, &freelancer, &arbitrator, &token.address);
    let res = escrow_client.try_add_milestone(&client, &id, &String::from_str(&env, "Zero MS"), &0);
    assert_eq!(res, Err(Ok(EscrowError::InvalidAmount)));
}

#[test]
fn test_double_funding_fails() {
    let (env, client, freelancer, arbitrator, token, _admin, escrow_id_addr) = setup_test();
    let escrow_client = EscrowContractClient::new(&env, &escrow_id_addr);

    let id = escrow_client.create_escrow(&client, &freelancer, &arbitrator, &token.address);
    escrow_client.add_milestone(&client, &id, &String::from_str(&env, "MS 1"), &1_000);
    escrow_client.fund_escrow(&client, &id);

    let res = escrow_client.try_fund_escrow(&client, &id);
    assert_eq!(res, Err(Ok(EscrowError::AlreadyFunded)));
}

#[test]
fn test_cannot_approve_unsubmitted_milestone() {
    let (env, client, freelancer, arbitrator, token, _admin, escrow_id_addr) = setup_test();
    let escrow_client = EscrowContractClient::new(&env, &escrow_id_addr);

    let id = escrow_client.create_escrow(&client, &freelancer, &arbitrator, &token.address);
    escrow_client.add_milestone(&client, &id, &String::from_str(&env, "MS 1"), &1_000);
    escrow_client.fund_escrow(&client, &id);

    let res = escrow_client.try_approve_milestone(&client, &id, &0);
    assert_eq!(res, Err(Ok(EscrowError::InvalidMilestoneStatus)));
}

#[test]
fn test_cancel_project_and_refund() {
    let (env, client, freelancer, arbitrator, token, _admin, escrow_id_addr) = setup_test();
    let escrow_client = EscrowContractClient::new(&env, &escrow_id_addr);

    let id = escrow_client.create_escrow(&client, &freelancer, &arbitrator, &token.address);
    escrow_client.add_milestone(&client, &id, &String::from_str(&env, "MS 1"), &4_000);
    escrow_client.fund_escrow(&client, &id);

    let client_bal_before = token.balance(&client);
    escrow_client.cancel_escrow(&client, &id);

    assert_eq!(token.balance(&client), client_bal_before + 4_000);
}

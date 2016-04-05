#pragma strict

import UnityEngine;
import UnityStandardAssets.Characters.ThirdPerson;

@script RequireComponent(Rigidbody)
@script RequireComponent(CapsuleCollider)
@script RequireComponent(Animator)

@SerializeField private var movingTurnSpeed : float = 360; //var turn angle walk
@SerializeField private var stationaryTurnSpeed : float = 180; //var turn angle still
@SerializeField private var jumpPower : float = 6; //jump height
@Range(1,4) @SerializeField private var gravityMultiplier : float = 2; //Gravity
@SerializeField private var runCycleLegOffset : float = 0.2; //specific to the character in sample assets, will need to be modified to work with others.
@SerializeField private var moveSpeedMultiplier : float = 1; //walk speed
@SerializeField private var animSpeedMultiplier : float = 1;
@SerializeField private var groundCheckDistance : float = 0.3;

private var rb : Rigidbody;
private var anim : Animator;
private var isGrounded : boolean;
private var origGroundCheckDistance: float;
private var half : float = 0.5;
private var turnAmount : float;
private var forwardAmount : float;
private var groundNormal : Vector3;
private var capsuleHeight : float;
private var capsuleCenter : Vector3;
private var capsule : CapsuleCollider;
private var crouching : boolean;

function Start () {

	anim = GetComponent.<Animator>();
	rb = GetComponent.<Rigidbody>();
	capsule = GetComponent.<CapsuleCollider>();
	capsuleHeight = capsule.height;
	capsuleCenter = capsule.center;

	rb.constraints = RigidbodyConstraints.FreezeRotationX | RigidbodyConstraints.FreezeRotationY | RigidbodyConstraints.FreezeRotationZ;
	origGroundCheckDistance = groundCheckDistance;

}

function Move (move : Vector3, crouch : boolean, jump : boolean) {

	//convert the world relative moveInput vector into a local-relative
	//turn amount and forward amount required to head in the desired direction
	if(move.magnitude > 1)move.Normalize(); //change length of vector if too long
	move = transform.InverseTransformDirection(move); //world fwd = local space
	CheckGroundStatus(); //call this function
	move = Vector3.ProjectOnPlane(move, groundNormal);
	turnAmount = Mathf.Atan2(move.x, move.z);//tangent to smooth turn
	forwardAmount = move.z; //set var to move z

	ApplyExtraTurnRotation(); //call this function

	//control and velocity handling is different when grounded and airbrone

	if(isGrounded){
		HandleGroundedMovement(crouch, jump);
	}
	else {
		HandleAirborneMovement();
	}

	ScaleCapsuleForCrouching(crouch);
	PreventStandingInLowHeadroom();

	//send input and other state parameters to the animator
	UpdateAnimator(move);

}

function ScaleCapsuleForCrouching(crouch : boolean){

	if(isGrounded && crouch){ //if crouching on the ground, change capsule size and check crouched
		if(crouching) return;
		capsule.height = capsule.height / 2;
		capsule.center = capsule.center / 2;
		crouching = true;

	}

	else{
		var crouchRay : Ray = new Ray(rb.position + Vector3.up * capsule.radius * half, Vector3.up);
		var crouchRayLength : float = capsuleHeight - capsule.radius * half; //calculate Ray Length

		//used to make sure a char can pass through a space
		if(Physics.SphereCast(crouchRay, capsule.radius * half, crouchRayLength, ~0, QueryTriggerInteraction.Ignore)) { 

			crouching = true;
			return;
		}

		capsule.height = capsuleHeight;
		capsule.center = capsuleCenter;
		crouching = false;
	}
}

function PreventStandingInLowHeadroom(){

	//prevent standing up in crouch-only zones
	if(!crouching){
		
		var crouchRay : Ray = new Ray(rb.position + Vector3.up * capsule.radius * half, Vector3.up);
		var crouchRayLength : float = capsuleHeight - capsule.radius * half; //calculate Ray Length

		//used to make sure a char can pass through a space
		if(Physics.SphereCast(crouchRay, capsule.radius * half, crouchRayLength, ~0, QueryTriggerInteraction.Ignore)) { 

			crouching = true;
			return;
		}
	}
}

function UpdateAnimator(move : Vector3){
	//update the animtor parameters
	anim.SetFloat("Forward", forwardAmount, 0.1, Time.deltaTime);
	anim.SetFloat("Turn", turnAmount, 0.1, Time.deltaTime);
	anim.SetBool("Crouch", crouching);
	anim.SetBool("OnGround", isGrounded);

	if(!isGrounded){ // if not on ground

		anim.SetFloat("Jump", rb.velocity.y); //jump
	}

	//calculate which leg is behind, so as to leave that leg trailing in the jump animation
	//(This code is reliant on the specific run cycle offset in our animations,
	//and assumes on leg passes the other at the normalized clip times of 0.0 and 0.5)

	var runCycle : float = 
		Mathf.Repeat(
			anim.GetCurrentAnimatorStateInfo(0).normalizedTime + runCycleLegOffset, 1);
	var jumpLeg : float = (runCycle < half ? 1 : -1)* forwardAmount;

	if(isGrounded){
		anim.SetFloat("JumpLeg", jumpLeg);
	}	

	//the anime speed multiplier allows the overal speed of walking/running to be tweaked in the inspector,
	//which affects the movement speed because of the root motion

	if(isGrounded && move.magnitude > 0){
		anim.speed = animSpeedMultiplier;
	}
	else {
		//don't use that while airbone
		anim.speed = 1;
	}

}

function HandleAirborneMovement(){

	//apply extra gravity from multiplier
	var extraGravityForce : Vector3 = (Physics.gravity * gravityMultiplier) - Physics.gravity;
	
	rb.AddForce(extraGravityForce);
	groundCheckDistance = rb.velocity.y < 0 ? origGroundCheckDistance : 0.01;
}

function HandleGroundedMovement(crouch : boolean, jump : boolean){

	//check whether conditions are right to allow a jump
	if(jump && !crouch && anim.GetCurrentAnimatorStateInfo(0).IsName("Grounded")){

		//jump
		rb.velocity = new Vector3(rb.velocity.x, jumpPower, rb.velocity.z);
		isGrounded = false;
		anim.applyRootMotion = false;
		groundCheckDistance = 0.1;
	}
}

function ApplyExtraTurnRotation(){

	//help the charcter turn faster (this is in addition to root rotation in the animation)

	var turnSpeed : float = Mathf.Lerp(stationaryTurnSpeed, movingTurnSpeed, forwardAmount);
	transform.Rotate(0, turnAmount * turnSpeed * Time.deltaTime, 0);
}

public function OnAnimatorMove(){

	//we implement this function to override the default root motion
	//this allows us to modify the position speed before its applied

	if(isGrounded && Time.deltaTime > 0){

		var v : Vector3 = (anim.deltaPosition * moveSpeedMultiplier) / Time.deltaTime;

		//we preserve the existing y part of the current velocity
		v.y = rb.velocity.y;
		rb.velocity = v;
	}
}

function CheckGroundStatus(){

	var hitInfo : RaycastHit;

	#if UNITY_EDITOR
		//helper to visualise the ground check ray in the scene view
		Debug.DrawLine(transform.position + (Vector3.up * 0.1), transform.position + (Vector3.up * 0.1) + (Vector3.down * groundCheckDistance));
	#endif

	//0.1 is a small offset to start the ray from inside the character
	// it is also good to note that the transform position in the sample assets is at the base of the character
	if(Physics.Raycast(transform.position + (Vector3.up * 0.1), Vector3.down, hitInfo, groundCheckDistance)){

		groundNormal = hitInfo.normal;
		isGrounded = true;
		anim.applyRootMotion = true;
		
	}
	else {
		isGrounded = false;
		groundNormal = Vector3.up;
		anim.applyRootMotion = false;
		Debug.Log("Poopy");
	}
}
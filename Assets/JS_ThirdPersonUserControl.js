#pragma strict

import System;
import UnityEngine;
import UnityStandardAssets.Characters.ThirdPerson;
import UnityStandardAssets.CrossPlatformInput;


@script RequireComponent(JS_ThirdPersonCharacter)

private var character : JS_ThirdPersonCharacter; // a reference to the tpc on the object
private var cam : Transform; //a reference to the main camera in the scenes transform
private var camFwd : Vector3; //the current forward direction of the camera
private var move : Vector3;
private var jump : boolean; // the world relative desired move direction, calculated from the camfwd and user input


public function Start () {
	//get the transform of the main camera
	if(Camera.main != null){

		cam = Camera.main.transform;
	}
	else{
		Debug.LogWarning("Warning: no main camera found. Third person character needs a camera tagged \"MainCamera \", for camera-relative controls");
		//we use self-relative controls in this case, which probably isnt what the user wants
	}

	//get the tpc ( thisshould never be null due to require component)
	character = GetComponent.<JS_ThirdPersonCharacter>();

}

public function Update () {

	if(!jump){

		jump = CrossPlatformInputManager.GetButtonDown("Jump");

	}
}

//fixed update is called in synch with physics
public function FixedUpdate(){

	Debug.Log("run");
	//read inputs
	var h : float = CrossPlatformInputManager.GetAxis("Horizontal");
	var v : float = CrossPlatformInputManager.GetAxis("Vertical");
	var crouch : boolean = Input.GetKey(KeyCode.C);

	//calculate move direction to pass to character
	if(cam != null){
		//calculate camera relative direction to move
		camFwd = Vector3.Scale(cam.forward, new Vector3(1,0,1)).normalized;
		move = v * camFwd + h * cam.right;
	}

	else{
		//we use world-relative directions in the case of no main camera
		move = v * Vector3.forward + h * Vector3.right;
	}

	#if !MOBILE_INPUT
	//walk speed multiplier

		if(Input.GetKey(KeyCode.LeftShift)) move *= 0.5;
	#endif

	//pass all parameters to the character control script
	
	character.Move(move, crouch, jump);
	jump = false;
}
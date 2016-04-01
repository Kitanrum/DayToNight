#pragma strict

enum RotationAxes { MouseXAndY = 0, MouseX = 1, MouseY = 2} //Array of axes

var axes : RotationAxes = RotationAxes.MouseXAndY;

var anim : Animator;


var moveSpeed : float = 5;
var xSens : float = 5;
var ySens : float = 5;
var yMin : float = -30;
var yMax : float = 30;
var yRot : float = 0;

var jumpDelay : boolean;

function Start(){

	anim = GetComponent(Animator);
	//anim.SetBool("OnGround", true);
}

function Update () {

	MoveAround();

	// LookAround();

}

function MoveAround(){


	anim.SetFloat("Forward", Input.GetAxis("Vertical"));	 
	anim.SetFloat("Turn",Input.GetAxis("Horizontal"));

	if(Input.GetKeyDown(KeyCode.Space) && jumpDelay == false){

		anim.SetBool("OnGround", false);

		Jump();
	}
	else if(jumpDelay == true){
		anim.SetBool("OnGround",true);
	}
}

function LookAround(){


	if(axes == RotationAxes.MouseXAndY){
		
		yRot += Input.GetAxis("Mouse Y") * ySens;
		yRot = Mathf.Clamp(yRot, yMin, yMax);
		var xRot : float = transform.localEulerAngles.y + Input.GetAxis("Mouse X") * xSens;

		transform.localEulerAngles = new Vector3(-yRot, xRot,0);
	}

	else if (axes == RotationAxes.MouseX){

		var rotX : float = transform.localEulerAngles.y + Input.GetAxis("Mouse X") * xSens;

		transform.localEulerAngles = new Vector3(0,rotX,0);

	}

	else {

		yRot += Input.GetAxis("Mouse Y") * ySens;
		yRot = Mathf.Clamp(yRot, yMin, yMax);

		transform.localEulerAngles = new Vector3(-yRot, 0, 0);
	}
}

function Jump(){
	anim.SetBool("Jump 1", true);
	GetComponent.<Rigidbody>().velocity.y = 5;
	jumpDelay = true;
	yield WaitForSeconds(1);
	jumpDelay = false;
	anim.SetBool("Jump 1", false);

}

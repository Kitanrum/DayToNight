using UnityEngine;
using System.Collections;

[DisallowMultipleComponent]
[RequireComponent(typeof(Animator))]
[RequireComponent(typeof(Rigidbody))]
[RequireComponent(typeof(CapsuleCollider))]

public class Movement : MonoBehaviour {

	enum RotationAxes { MouseXAndY = 0, MouseX = 1, MouseY = 2}

	RotationAxes axes = RotationAxes.MouseXAndY;
	Animator anim;
	Rigidbody rb;
	
	float moveSpeed = 5.0f;
	float xSens = 5.0f;
	float ySens = 5.0f;
	float yMin = -30.0f;
	float yMax = 30.0f;
	float yRot = 0.0f;

	bool jumpDelay;

	// Use this for initialization
	void Start () {

		anim = GetComponent<Animator>();
		rb = GetComponent<Rigidbody>();
	
	}
	
	// Update is called once per frame
	void Update () {

		MoveAround();

		LookAround();
	
	}

	void MoveAround(){

		anim.SetFloat("Forward", Input.GetAxis("Vertical"));
		anim.SetFloat("Turn",Input.GetAxis("Horizontal"));

		if(Input.GetKeyDown(KeyCode.Space) && jumpDelay == false){

			Jump();
		}
	}

	void LookAround(){

		float xRot = transform.localEulerAngles.y + Input.GetAxis("Mouse X") * xSens;


		if(axes == RotationAxes.MouseXAndY){

			yRot += Input.GetAxis("Mouse Y") * ySens;
			yRot = Mathf.Clamp(yRot, yMin, yMax);
			
			transform.localEulerAngles = new Vector3(-yRot, xRot, 0);

		}

		else if(axes == RotationAxes.MouseX){

			transform.localEulerAngles = new Vector3(0,xRot,0);

		}

		else{
			yRot += Input.GetAxis("Mouse Y") * ySens;
			yRot = Mathf.Clamp(yRot, yMin, yMax);

			transform.localEulerAngles = new Vector3(-yRot, 0, 0);
		}
	}

	IEnumerator Jump(){
		rb.velocity = new Vector3(0, 5, 0);
		jumpDelay = true;
		yield return new WaitForSeconds(1);
		jumpDelay = false;
	}
}

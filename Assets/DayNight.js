#pragma strict


public var dayLength : float;
public var rotationSpeed : float;

public var sky : Skybox;

function Start () {


}

function Update () {

	rotationSpeed = Time.deltaTime / dayLength;

	transform.Rotate(0, rotationSpeed, 0);

}
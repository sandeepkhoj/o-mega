/* package whatever; // don't place package name! */

import java.util.*;
import java.lang.*;
import java.io.*;

/* Name of the class has to be "Main" only. */
public class Main {
	public static void main (String[] args) throws java.lang.Exception {
		// your code goes here
		Scanner x = new Scanner(System.in);
      int a = x.nextInt();
      int b=x.nextInt();
      System.out.println(abc(a,b));
	}
  public static int abc(int a,int b)
  {
    return a+b;
  }
}
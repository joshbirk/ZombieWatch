ZombieWatch for Salesforce
==========================

This is an intentionally whimsical IoT demonstration involving a USB web camera, a Raspberry Pi, a zombie and a desktop missile launcher.  

It also uses the [CamFind API](http://cloudsightapi.com/api) and, of course, [Salesforce](http://developer.salesforce.com).

[Here is a video of it in action.](https://www.youtube.com/watch?v=pJu7X0wOHSQ)

What you are seeing is:

**0:18** The Raspberry Pi on my desk is logged into Salesforce and has subscribed to a PushTopic.  The window in the lower left is a second web camera to capture the video feed.

**0:19 - 0:35** The web camera attached to the Pi is taking pictures every few seconds and compares it to a baseline image.  The number is the reported difference.  If the number is too high (like because a hand is accidentally in the way) or too low (due to minor light changes, etc) then it is tossed out.

**0:35** The zombie placed in frame is detected due to causing a noticeable image difference.  The image is sent to the CamFind API for recognition.

**0:44** Flipping over to Salesforce, we see Chatter has been updated to notify the user that something has been detected and more information is coming.

**1:11** Camfind returns and has detected the object as a "white and brown zombie figure".  

**1:27** Since the finding included the word "zombie", it is considered a threat and so a Salesforce Case is created.

**1:37** We see the Case includes the information from CamFind and the picture used for detection.

**2:03** Responding to a Chatter post #really creates a custom object which includes the message.  This object is tracked via the Streaming API topic that the Pi is subscribed.

**2:07** The Pi gets the message, parses the word "kill" as a command to attack and fires the USB Missile Launcher.

Not shown is the image taken after the shot which shows if the zombie was properly slain.  If my Dream Cheeky was working correctly, you could aim and shoot again if you missed.  Sadly my version has a broken motor and is stuck with one shot.

There is nothing particularly special about the code.  It's using node packages to handle the image comparison (resemble.js) and to wrap the CamFind API as well as the Dream Cheeky launcher.

The multiple shell commands were just more convenient than extended process calls in node.

This does not include the Trigger or PushTopic code, but it is straightforward.  Available on request.

In theory, MetaMind could be used in place of CamFind but I'll have get dev access to prove that out.


import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { TextPlugin } from 'gsap/TextPlugin'
import { CustomEase } from 'gsap/CustomEase'
import { EasePack } from 'gsap/EasePack'
import { Flip } from 'gsap/Flip'
import { Observer } from 'gsap/Observer'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import { SplitText } from 'gsap/SplitText'
import { Draggable } from 'gsap/Draggable'

gsap.registerPlugin(
  ScrollTrigger,
  TextPlugin,
  CustomEase,
  EasePack,
  Flip,
  Observer,
  MotionPathPlugin,
  SplitText,
  Draggable,
)

// Custom eases
CustomEase.create('iris', 'M0,0 C0.14,0 0.27,0.3 0.5,0.5 0.73,0.7 0.86,1 1,1')
CustomEase.create('smoothStep', 'M0,0 C0.25,0 0.25,1 1,1')
CustomEase.create('expo', 'M0,0 C0.16,1 0.3,1 1,1')

// Global GSAP defaults
gsap.defaults({
  ease: 'power2.out',
  duration: 0.6,
})

// ScrollTrigger defaults
ScrollTrigger.defaults({
  toggleActions: 'play none none reverse',
})

export { gsap, ScrollTrigger, TextPlugin, CustomEase, Flip, Observer, SplitText, Draggable }

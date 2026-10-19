import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Zap, Eye, Goal, Building, Users, Rocket, HeartHandshake, Target, Handshake } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { getAboutLeadershipContent } from '@/lib/about-content';

export const dynamic = 'force-dynamic';

export default async function AboutPage() {
  let leadershipContent: Awaited<
    ReturnType<typeof getAboutLeadershipContent>
  > | null = null;
  try {
    leadershipContent = await getAboutLeadershipContent();
  } catch (error) {
    console.error('Unable to load About page leadership content.', error);
  }

  const heroImage = PlaceHolderImages.find((img) => img.id === 'service-detail-hero');
  return (
    <div>
      <section className="relative h-[300px] md:h-[400px] w-full text-white">
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt="About Us"
            fill
            className="object-cover"
            priority
            data-ai-hint={heroImage.imageHint}
          />
        )}
        <div className="absolute inset-0 bg-black/50" />
        <div className="container mx-auto relative z-10 flex h-full flex-col items-center justify-center text-center px-4">
          <div className="inline-block bg-primary/20 p-4 rounded-full mb-4">
            <Building className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            About All In One Solution
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/90 mt-4 max-w-3xl">
            Simplifying Your Path to Success.
          </p>
        </div>
      </section>

      <section className="container mx-auto py-16 px-4">
        <div className="grid md:grid-cols-2 gap-12 items-start">
            <div className="space-y-4">
                <div className="inline-block bg-primary/10 p-3 rounded-lg">
                    <Users className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Who Are We?</h2>
                <p className="text-lg text-muted-foreground break-words">
                    We are a dedicated team of technologists, designers, and business strategists united by a single purpose: to provide seamless, comprehensive solutions. As your &quot;All In One&quot; partner, we integrate expert services—from web development and IT support to business consulting and office supplies—eliminating the need for multiple vendors so you can focus on what matters most: growing your business.
                </p>
            </div>
            <div className="space-y-4">
                <div className="inline-block bg-primary/10 p-3 rounded-lg">
                    <Rocket className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">What Drives Us?</h2>
                <p className="text-lg text-muted-foreground break-words">
                    Our driving force is your success. We are passionate about empowering businesses to thrive in a dynamic world. This commitment fuels our vision to be the most trusted single-source partner for companies of all sizes. We are driven by innovation, a dedication to excellence, and the goal of fostering long-term partnerships built on trust and measurable impact.
                </p>
            </div>
        </div>
      </section>

      <section className="bg-secondary/50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
              Our Core Commitments
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <Card className="flex flex-col items-center p-6">
              <CardHeader className="items-center">
                <div className="p-3 bg-primary/10 rounded-full mb-2">
                  <HeartHandshake className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold">Empowerment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                    To provide integrated, reliable, and innovative solutions that empower you to focus on your core business.
                </p>
              </CardContent>
            </Card>
            <Card className="flex flex-col items-center p-6">
              <CardHeader className="items-center">
                <div className="p-3 bg-primary/10 rounded-full mb-2">
                  <Target className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold">Excellence</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                    To deliver seamless and superior service by understanding your unique needs and continuously adapting our offerings.
                </p>
              </CardContent>
            </Card>
            <Card className="flex flex-col items-center p-6">
              <CardHeader className="items-center">
                <div className="p-3 bg-primary/10 rounded-full mb-2">
                  <Handshake className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold">Trust</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                    To be the most trusted partner for your business, recognized for our commitment to customer success and support.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="container mx-auto py-16 px-4">
        <div className="text-center max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
            Your Integrated Partner for Growth
          </h2>
          <p className="text-lg text-muted-foreground break-words">
            All In One Solution was founded on a simple principle: businesses
            thrive when they can focus on their core purpose. We saw a landscape
            where companies had to juggle multiple vendors for technology,
            design, and essential services—a process that was often inefficient
            and fragmented. We set out to change that by creating a single,
            reliable partner that provides comprehensive, integrated solutions
            tailored to the unique needs of each client.
          </p>
        </div>
      </section>

      <section className="bg-secondary/50 py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <Card className="flex flex-col items-center p-6">
              <CardHeader className="items-center">
                <div className="p-3 bg-primary/10 rounded-full mb-2">
                  <Zap className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold">Our Mission</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  To empower businesses by providing integrated, reliable, and
                  innovative solutions across technology, design, and essential
                  services, ensuring our clients can focus on what they do best:
                  growing their business.
                </p>
              </CardContent>
            </Card>
            <Card className="flex flex-col items-center p-6">
              <CardHeader className="items-center">
                <div className="p-3 bg-primary/10 rounded-full mb-2">
                  <Eye className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold">Our Vision</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  To be the most trusted single-source partner for businesses
                  of all sizes, recognized for our commitment to excellence,
                  customer success, and comprehensive support in a dynamic
                  world.
                </p>
              </CardContent>
            </Card>
            <Card className="flex flex-col items-center p-6">
              <CardHeader className="items-center">
                <div className="p-3 bg-primary/10 rounded-full mb-2">
                  <Goal className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold">Our Goal</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  To deliver seamless and superior service by understanding our
                  clients&apos; unique needs, fostering long-term partnerships, and
                  continuously adapting our offerings to provide maximum value
                  and impact.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="container mx-auto py-16 px-4">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-block bg-primary/10 p-4 rounded-full mb-4">
            <Users className="w-10 h-10 text-primary" />
          </div>
          {leadershipContent ? (
            <>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
                {leadershipContent.heading}
              </h2>
              <p className="text-lg text-muted-foreground break-words whitespace-pre-line">
                {leadershipContent.description}
              </p>
              {leadershipContent.members.length > 0 && (
                <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {leadershipContent.members.map((member) => (
                    <Card key={member.id} className="h-full overflow-hidden text-left">
                      <CardContent className="flex h-full flex-col items-center p-6 text-center">
                        <div className="mb-5 flex h-32 w-32 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-3xl font-semibold text-primary ring-4 ring-background shadow-md">
                          {member.imageData ? (
                            <Image
                              src={member.imageData}
                              alt={member.name}
                              width={128}
                              height={128}
                              unoptimized
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span aria-hidden="true">{member.name.trim().charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <h3 className="text-xl font-semibold tracking-tight">{member.name}</h3>
                        <p className="mt-1 text-sm font-medium text-primary">{member.position}</p>
                        {member.bio && (
                          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                            {member.bio}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Leadership information is temporarily unavailable.
            </p>
          )}
        </div>
      </section>

      <section className="bg-primary text-primary-foreground">
        <div className="container mx-auto py-16 px-4 text-center">
            <Rocket className="w-12 h-12 mx-auto mb-4"/>
          <h2 className="text-3xl font-bold mb-4">
            Join Us on Our Journey
          </h2>
          <p className="text-lg max-w-3xl mx-auto mb-8 break-words">
            We are always looking for passionate talent and forward-thinking partners. Let&apos;s build the future together.
          </p>
          <Link
            href="/contact"
            className="inline-block bg-primary-foreground text-primary font-semibold py-3 px-6 rounded-lg hover:bg-primary-foreground/90 transition-colors"
          >
            Get In Touch
          </Link>
        </div>
      </section>
    </div>
  );
}

export const metadata = {
    title: 'About Us | All In One Solution',
    description: 'Learn about the mission, vision, and team behind All In One Solution, your trusted partner for integrated business services.',
};

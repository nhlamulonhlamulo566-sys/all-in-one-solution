import type { Service } from '@/lib/types';

export const services: Service[] = [
  {
    id: 'web-development',
    name: 'Web Development',
    category: 'Technology',
    icon: 'Code',
    shortDescription:
      'Building responsive, high-performance websites and web applications tailored to your business needs.',
    longDescription:
      'Our comprehensive Web Development service provides end-to-end solutions for your digital presence. We build any kind of website or web application imaginable, from dynamic e-commerce platforms to sophisticated Point of Sale (POS) systems and custom enterprise software. We specialize in creating custom digital experiences that are not only visually stunning but also highly functional and secure. Utilizing modern technologies like React and Next.js, we build responsive, high-performance platforms optimized for speed and scalability. Our service includes managed website and database hosting, ensuring your application is reliable and always available. From initial concept and UI/UX design to backend architecture, deployment, and ongoing maintenance, our expert team ensures your project aligns perfectly with your business objectives.',
    imageId: 'web-dev-service',
  },
  {
    id: 'graphic-design',
    name: 'Graphic Design',
    category: 'Design',
    icon: 'Palette',
    shortDescription:
      'Creating stunning visuals that define your brand identity, from logos to marketing materials.',
    longDescription:
      "Elevate your brand with our expert Graphic Design services. We specialize in creating a cohesive and compelling visual identity that resonates with your target audience. Our creative process covers everything from logo design and brand style guides to creating beautiful marketing collateral for digital and print. We focus on producing unique, memorable designs that not only look great but also effectively communicate your brand's story and values.",
    imageId: 'design-service',
  },
  {
    id: 'office-supply',
    name: 'Office Supply',
    category: 'Business',
    icon: 'Package',
    shortDescription:
      'Your one-stop source for all office needs, from furniture and stationery to tech and supplies.',
    longDescription:
      "Streamline your procurement process with our comprehensive Office Supply service. We are your dedicated partner for sourcing and delivering everything your business needs to operate efficiently. We understand that every client is unique, which is why we focus on supplying exactly what you need, when you need it.\n\nOur extensive catalog includes:\n- Office Furniture: Ergonomic chairs, desks, collaborative workstations, and storage solutions to create a productive environment.\n- Stationery and Supplies: From premium paper brands and custom notebooks to everyday essentials like pens and organizers.\n- Technology and Hardware: We procure and deliver laptops, desktops, and printers from any brand you prefer, ensuring you get the technology that fits your workflow.\n- Custom Orders: If you need something specific, we'll find it. Our procurement specialists are experts at sourcing a wide range of products to meet your precise requirements.\n\nWe pride ourselves on reliability and flexibility, ensuring you receive high-quality products that meet your budget and timeline. Let us handle the supplies, so you can focus on your business.",
    imageId: 'office-supply-service',
  },
  {
    id: 'business-consulting',
    name: 'Business Consulting',
    category: 'Business',
    icon: 'Briefcase',
    shortDescription:
      'Providing expert advice to help you navigate challenges and seize growth opportunities.',
    longDescription:
      'Navigate the complexities of the modern business landscape with our expert Business Consulting services. We partner with you to identify strategic opportunities, overcome challenges, and drive sustainable growth. Our experienced consultants offer tailored advice in areas such as market analysis, operational efficiency, financial planning, and organizational strategy. We provide actionable insights and a clear roadmap to help you achieve your long-term business goals.',
    imageId: 'consulting-service',
  },
  {
    id: 'it-technician',
    name: 'Information Technology Technician',
    category: 'Technology',
    icon: 'HardHat',
    shortDescription:
      'Expert, hands-on IT support including hardware setup, software troubleshooting, and help desk services.',
    longDescription:
      "Our Information Technology Technicians are the backbone of your daily operations, providing comprehensive, hands-on support to keep your business running at peak efficiency. We function as your dedicated Help Desk, offering prompt and professional assistance for all your IT needs.\n\nOur services include:\n- Desktop and Laptop Setup: We handle the complete lifecycle of employee workstations, from unboxing and configuration to software installation and user onboarding.\n- Printer Installation and Configuration: Say goodbye to printing frustrations. We manage the setup, networking, and maintenance of all your office printers to ensure seamless operation.\n- Hardware and Software Troubleshooting: From system crashes to software glitches, our technicians diagnose and resolve issues quickly to minimize downtime.\n- Network and Connectivity Support: We provide first-line support for network connectivity issues, ensuring your team stays online and productive.\n- User Account Management: We manage user accounts and permissions, ensuring secure and appropriate access to your company's resources.\n\nWe are proficient in supporting a diverse ecosystem of hardware and software from all major brands, including Dell, HP, Apple, Microsoft, and more. Depend on our certified experts to maintain your heterogeneous IT infrastructure and provide your team with the friendly, reliable support they need to succeed.",
    imageId: 'it-tech-service',
  },
  {
    id: 'network-administrator',
    name: 'Network Administrator',
    category: 'Technology',
    icon: 'Network',
    shortDescription:
      'Expert management of your network infrastructure, including routers, switches, and firewalls, to ensure seamless connectivity and security.',
    longDescription:
      "Our Network Administration service ensures your business's digital backbone is robust, secure, and always-on. We handle everything from the initial setup and configuration of routers, switches, and firewalls to ongoing monitoring and maintenance. Our experts are vendor-agnostic and proficient with all major networking brands such as Cisco, Juniper, Ubiquiti, and more. We troubleshoot complex network issues, optimize performance, and implement advanced security protocols to protect your data, ensuring your team stays connected and productive regardless of your hardware.",
    imageId: 'network-admin-service',
  },
];

export const categories = [
  'All',
  ...Array.from(new Set(services.map((s) => s.category))),
];

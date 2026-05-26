import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Phone, Mail, Globe } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="gradient-hero text-white rounded-xl p-8 mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Hubungi Kami</h1>
        <p className="mt-2 text-blue-200">
          Informasi kontak resmi LIPAN RI
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-blue-100">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900">Alamat Kantor</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Gedung Yayasan Purna Bakti (YARNATI)<br />
                  Lt. 4 Ruang 407-408<br />
                  Jl. Proklamasi No. 44<br />
                  Pegangsaan, Menteng<br />
                  Jakarta Pusat 10320
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900">Telepon</h3>
                <p className="text-sm text-muted-foreground mt-1">021-392-8018</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900">Email</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  dpn.lipanri@gmail.com
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900">Website</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  www.lipan-ri.org
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-100">
          <CardContent className="p-6">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.4!2d106.847!3d-6.183!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sJl.%20Proklamasi%20No.44%20Jakarta%20Pusat!5e0!3m2!1sen!2sid!4v1690000000000"
              width="100%"
              height="300"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="rounded-lg"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
